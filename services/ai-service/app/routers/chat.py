import json
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.gemini_client import GeminiClient
from app.prompts.complaint_draft import COMPLAINT_DRAFT_PROMPT
from app.prompts.eligibility import ELIGIBILITY_PROMPT_TEMPLATE
from app.prompts.scheme_discovery import SCHEME_DISCOVERY_PROMPT
from app.schemas.chat import ChatRequest, ChatResponse, ConversationListOut, ConversationOut
from app.utils.context_manager import ConversationContextManager
from app.utils.intent_classifier import IntentClassifier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai")


def get_gemini_client() -> GeminiClient:
    return GeminiClient()


def get_context_manager() -> ConversationContextManager:
    return ConversationContextManager()


def get_intent_classifier() -> IntentClassifier:
    return IntentClassifier()


@router.post("/api/v1/ai/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    gemini: GeminiClient = Depends(get_gemini_client),
    ctx_manager: ConversationContextManager = Depends(get_context_manager),
    classifier: IntentClassifier = Depends(get_intent_classifier),
):
    ctx = None
    if request.conversation_id:
        ctx = await ctx_manager.get_context(request.conversation_id)

    if not ctx:
        ctx = await ctx_manager.create_context(
            citizen_id=request.citizen_id,
            language=request.language,
            dialect=request.dialect,
            conversation_id=request.conversation_id,
        )

    intent_result = classifier.classify_intent(request.message, request.language)
    intent = intent_result.intent
    entities = intent_result.entities

    scheme_data = None

    if intent == "scheme_discovery":
        response_text, scheme_data = await _handle_scheme_discovery(
            gemini, ctx, request, entities
        )
    elif intent == "application_help":
        response_text = await _handle_application_help(
            gemini, request, entities
        )
    elif intent == "complaint":
        response_text = await _handle_complaint(
            gemini, request, entities
        )
    elif intent == "status_check":
        response_text = await _handle_status_check(
            gemini, request, entities
        )
    elif intent == "document_help":
        response_text = await _handle_document_help(
            gemini, request, entities
        )
    elif intent == "eligibility_check":
        response_text, scheme_data = await _handle_eligibility_check(
            gemini, ctx, request, entities
        )
    else:
        response_text = gemini.generate_response(
            prompt=request.message,
            language=request.language,
            dialect=request.dialect,
        )

    suggested_replies = _generate_suggested_replies(intent, response_text, request.language)

    await ctx_manager.update_context(
        conversation_id=ctx.conversation_id,
        message=request.message,
        response=response_text,
        intent=intent,
        entities=entities,
    )

    return ChatResponse(
        response=response_text,
        conversation_id=ctx.conversation_id,
        suggested_replies=suggested_replies,
        schemes=scheme_data,
        intent=intent,
    )


async def _handle_scheme_discovery(
    gemini: GeminiClient,
    ctx: Any,
    request: ChatRequest,
    entities: Dict[str, Any],
):
    citizen_profile = await _fetch_citizen_profile(request.citizen_id)
    matched_schemes = await _fetch_eligible_schemes(citizen_profile)

    conversation_history = "\n".join(
        f"{m['role']}: {m['content']}" for m in ctx.get_recent_messages(5)
    )

    prompt = SCHEME_DISCOVERY_PROMPT.format(
        citizen_name=citizen_profile.get("name", "User"),
        citizen_age=citizen_profile.get("age", "N/A"),
        citizen_gender=citizen_profile.get("gender", "N/A"),
        citizen_state=citizen_profile.get("state", "N/A"),
        citizen_district=citizen_profile.get("district", "N/A"),
        citizen_caste=citizen_profile.get("caste_category", "N/A"),
        citizen_income=citizen_profile.get("annual_income", "N/A"),
        citizen_occupation=citizen_profile.get("occupation", "N/A"),
        citizen_education=citizen_profile.get("education", "N/A"),
        citizen_disability_status=citizen_profile.get("disability_status", "No"),
        citizen_bpl_status=citizen_profile.get("bpl_card_holder", "No"),
        citizen_area_type=citizen_profile.get("area_type", "Rural"),
        citizen_family_size=citizen_profile.get("family_size", "N/A"),
        citizen_marital_status=citizen_profile.get("marital_status", "N/A"),
        matched_schemes=(
            json.dumps(matched_schemes, ensure_ascii=False, indent=2)
            if matched_schemes else "No specific schemes found"
        ),
        conversation_history=conversation_history,
        user_language=request.language,
        user_dialect=request.dialect or "Standard",
    )

    response_text = gemini.generate_response(prompt, language=request.language, dialect=request.dialect)

    ranked = gemini.rank_schemes_by_relevance(citizen_profile, matched_schemes)
    scheme_data = ranked if ranked else matched_schemes[:5]

    return response_text, scheme_data


async def _handle_application_help(
    gemini: GeminiClient,
    request: ChatRequest,
    entities: Dict[str, Any],
):
    scheme_name = entities.get("scheme_name", "the scheme")
    prompt = (
        f"The user wants help applying for {scheme_name}. "
        f"Their question is: {request.message}\n\n"
        f"Please provide step-by-step application instructions including:\n"
        f"1. List of required documents\n"
        f"2. Where to get the application form (online portal URL or CSC center)\n"
        f"3. Step-by-step fill-up instructions\n"
        f"4. Where to submit the form\n"
        f"5. Fees (if any) and payment methods\n"
        f"6. Expected processing time\n"
        f"7. How to track application status\n"
        f"8. Helpline number for queries\n\n"
        f"Be specific and practical. Include any recent changes to the application process."
    )
    return gemini.generate_response(prompt, language=request.language, dialect=request.dialect)


async def _handle_complaint(
    gemini: GeminiClient,
    request: ChatRequest,
    entities: Dict[str, Any],
):
    prompt = COMPLAINT_DRAFT_PROMPT.format(
        user_description=request.message,
        user_language=request.language,
        user_dialect=request.dialect or "Standard",
        department_hint=entities.get("department", "unknown"),
        citizen_location=entities.get("location", "unknown"),
        previous_attempts=entities.get("previous_attempts", "None mentioned"),
    )

    complaint_json_str = gemini.generate_response(
        prompt,
        language="en",
        temperature=0.1,
    )

    try:
        cleaned = complaint_json_str.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        complaint_data = json.loads(cleaned.strip())

        formatted = _format_complaint_response(complaint_data, request.language)
        return formatted
    except (json.JSONDecodeError, Exception):
        return complaint_json_str


def _format_complaint_response(complaint_data: Dict, language: str) -> str:
    if language == "hi":
        return (
            f"**शिकायत का विवरण तैयार**\n\n"
            f"**विभाग:** {complaint_data.get('department', 'अज्ञात')}\n"
            f"**शिकायत प्रकार:** {complaint_data.get('issue_type', 'अन्य')}\n"
            f"**प्राथमिकता:** {complaint_data.get('priority', 'मध्यम').upper()}\n\n"
            f"**औपचारिक विवरण:**\n{complaint_data.get('description_formal', '')}\n\n"
            f"**आवश्यक साक्ष्य:**\n" +
            "\n".join(f"- {e}" for e in complaint_data.get('evidence_needed', [])) +
            "\n\nक्या आप इस शिकायत को दर्ज करना चाहते हैं? (हाँ/नहीं)"
        )
    else:
        return (
            f"**Complaint Draft Ready**\n\n"
            f"**Department:** {complaint_data.get('department', 'Unknown')}\n"
            f"**Issue Type:** {complaint_data.get('issue_type', 'Other')}\n"
            f"**Priority:** {complaint_data.get('priority', 'medium').upper()}\n\n"
            f"**Formal Description:**\n{complaint_data.get('description_formal', '')}\n\n"
            f"**Evidence Needed:**\n" +
            "\n".join(f"- {e}" for e in complaint_data.get('evidence_needed', [])) +
            "\n\nWould you like to file this complaint? (Yes/No)"
        )


async def _handle_status_check(
    gemini: GeminiClient,
    request: ChatRequest,
    entities: Dict[str, Any],
):
    scheme_name = entities.get("scheme_name", "your application")
    prompt = (
        f"The user wants to check the status of {scheme_name}.\n\n"
        f"Their message: {request.message}\n\n"
        f"Please help them check their application status:\n"
        f"1. Ask them for their application ID/reference number if not provided\n"
        f"2. Explain how to check status online (portal URL and steps)\n"
        f"3. Explain how to check via SMS or missed call\n"
        f"4. Explain how to check at CSC center\n"
        f"5. Provide typical processing timeline\n"
        f"6. Explain what different status messages mean\n"
        f"7. Provide helpline number for further queries\n\n"
        f"Since we don't have direct access to the portal's API, guide them through the process."
    )
    return gemini.generate_response(prompt, language=request.language, dialect=request.dialect)


async def _handle_document_help(
    gemini: GeminiClient,
    request: ChatRequest,
    entities: Dict[str, Any],
):
    doc_type = entities.get("document_type", "document")
    prompt = (
        f"The user needs help with a {doc_type}.\n\n"
        f"Their message: {request.message}\n\n"
        f"Based on their request, provide appropriate help:\n"
        f"1. If they need to APPLY: steps to apply for {doc_type}, required documents, fees, process\n"
        f"2. If they need to CORRECT/UPDATE: correction process, fees, documents needed, timeline\n"
        f"3. If DOCUMENT IS LOST: re-issue process, FIR requirement (for some docs), fees\n"
        f"4. If they need VERIFICATION: how to verify authenticity online\n\n"
        f"Provide specific, actionable information."
    )
    return gemini.generate_response(prompt, language=request.language, dialect=request.dialect)


async def _handle_eligibility_check(
    gemini: GeminiClient,
    ctx: Any,
    request: ChatRequest,
    entities: Dict[str, Any],
):
    citizen_profile = await _fetch_citizen_profile(request.citizen_id)
    scheme_name = entities.get("scheme_name", "")

    if scheme_name:
        schemes = await _fetch_eligible_schemes(citizen_profile)
        target_scheme = next((s for s in schemes if scheme_name.lower() in s.get("name", "").lower()), None)

        if target_scheme:
            criteria = target_scheme.get("eligibility_criteria", [])
            prompt = ELIGIBILITY_PROMPT_TEMPLATE.format(
                citizen_name=citizen_profile.get("name", "User"),
                citizen_age=citizen_profile.get("age", "N/A"),
                citizen_gender=citizen_profile.get("gender", "N/A"),
                citizen_state=citizen_profile.get("state", "N/A"),
                citizen_district=citizen_profile.get("district", "N/A"),
                citizen_caste=citizen_profile.get("caste_category", "N/A"),
                citizen_income=citizen_profile.get("annual_income", "N/A"),
                citizen_occupation=citizen_profile.get("occupation", "N/A"),
                citizen_education=citizen_profile.get("education", "N/A"),
                citizen_bpl_status=citizen_profile.get("bpl_card_holder", "No"),
                citizen_family_size=citizen_profile.get("family_size", "N/A"),
                scheme_name=target_scheme.get("name", scheme_name),
                scheme_department=target_scheme.get("department", "N/A"),
                scheme_description=target_scheme.get("description", ""),
                scheme_benefits=target_scheme.get("benefits", ""),
                eligibility_criteria=json.dumps(criteria, ensure_ascii=False, indent=2),
                user_language=request.language,
                user_dialect=request.dialect or "Standard",
            )
            response = gemini.generate_response(prompt, language=request.language, dialect=request.dialect)

            ranked = gemini.rank_schemes_by_relevance(citizen_profile, [target_scheme])
            return response, ranked[:1]

    prompt = (
        f"The user wants to know if they are eligible for a scheme.\n\n"
        f"Their message: {request.message}\n\n"
        f"Please ask clarifying questions to determine:\n"
        f"1. Which specific scheme they are asking about\n"
        f"2. Their specific situation details\n"
        f"3. Provide general guidance on typical eligibility requirements\n"
        f"4. Suggest how they can check their eligibility"
    )
    response = gemini.generate_response(prompt, language=request.language, dialect=request.dialect)
    return response, None


def _generate_suggested_replies(intent: str, response: str, language: str) -> List[str]:
    suggestions = []

    if language == "hi":
        base_suggestions = {
            "scheme_discovery": [
                "मुझे इस योजना के बारे में और बताएं",
                "मैं आवेदन करना चाहता हूं",
                "क्या मैं पात्र हूं?",
                "और कौन सी योजनाएं हैं?",
            ],
            "application_help": [
                "आवेदन फॉर्म कहां मिलेगा?",
                "किन दस्तावेज़ों की जरूरत है?",
                "आवेदन शुल्क कितना है?",
                "कितने दिन में मिलेगा?",
            ],
            "complaint": [
                "हां, शिकायत दर्ज करें",
                "नहीं, बाद में करूंगा",
                "और सबूत चाहिए",
                "हैल्पलाइन नंबर बताएं",
            ],
            "status_check": [
                "मेरा आवेदन आईडी है",
                "मुझे आवेदन आईडी नहीं है",
                "कितने दिन हो गए?",
                "सीएससी सेंटर कहां है?",
            ],
            "document_help": [
                "आवेदन कैसे करें?",
                "सुधार कैसे करवाएं?",
                "खो गया है, क्या करूं?",
                "कितना खर्च आएगा?",
            ],
            "eligibility_check": [
                "हां, यही योजना",
                "क्या कोई और योजना है?",
                "आवेदन प्रक्रिया बताएं",
                "और क्या चाहिए?",
            ],
            "general_query": [
                "और जानकारी दें",
                "यह कैसे काम करता है?",
                "कोई और विकल्प है?",
                "धन्यवाद",
            ],
        }
    else:
        base_suggestions = {
            "scheme_discovery": [
                "Tell me more about this scheme",
                "I want to apply",
                "Am I eligible?",
                "What other schemes are available?",
            ],
            "application_help": [
                "Where do I get the form?",
                "What documents are needed?",
                "How much is the fee?",
                "How long does it take?",
            ],
            "complaint": [
                "Yes, file the complaint",
                "No, I'll do it later",
                "I need more evidence",
                "Give me the helpline number",
            ],
            "status_check": [
                "I have my application ID",
                "I don't have the ID",
                "How many days has it been?",
                "Where is the CSC center?",
            ],
            "document_help": [
                "How to apply?",
                "How to make corrections?",
                "It's lost, what to do?",
                "How much will it cost?",
            ],
            "eligibility_check": [
                "Yes, this scheme",
                "Any other scheme?",
                "Tell me the process",
                "What else is needed?",
            ],
            "general_query": [
                "Tell me more",
                "How does this work?",
                "Any other option?",
                "Thank you",
            ],
        }

    suggestions = base_suggestions.get(intent, base_suggestions["general_query"])
    return suggestions[:4]


async def _fetch_citizen_profile(citizen_id: str) -> Dict[str, Any]:
    return {
        "citizen_id": citizen_id,
        "name": "Citizen",
        "age": 30,
        "gender": "Unknown",
        "state": "",
        "district": "",
        "caste_category": "",
        "annual_income": 0,
        "occupation": "",
        "education": "",
        "disability_status": "No",
        "bpl_card_holder": "No",
        "area_type": "Rural",
        "family_size": 1,
        "marital_status": "Unknown",
        "children_count": 0,
        "pregnancy_status": "No",
    }


async def _fetch_eligible_schemes(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    return []


@router.get("/api/v1/ai/conversations/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: str,
    ctx_manager: ConversationContextManager = Depends(get_context_manager),
):
    ctx = await ctx_manager.get_context(conversation_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ConversationOut(
        id=ctx.conversation_id,
        citizen_id=ctx.citizen_id,
        language=ctx.language,
        dialect=ctx.dialect,
        summary=ctx.metadata.get("summary"),
        message_count=ctx.message_count,
        started_at=ctx.started_at,
        ended_at=ctx.ended_at,
    )


@router.delete("/api/v1/ai/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    ctx_manager: ConversationContextManager = Depends(get_context_manager),
):
    ctx = await ctx_manager.get_context(conversation_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await ctx_manager.save_conversation_summary(conversation_id)
    await ctx_manager.clear_context(conversation_id)


@router.get("/api/v1/ai/conversations", response_model=ConversationListOut)
async def list_conversations(
    citizen_id: str = Query(..., min_length=1),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    ctx_manager: ConversationContextManager = Depends(get_context_manager),
):
    result = await ctx_manager.list_conversations(
        citizen_id=citizen_id,
        page=page,
        page_size=page_size,
    )
    return ConversationListOut(**result)
