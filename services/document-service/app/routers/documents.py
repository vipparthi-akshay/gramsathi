import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form, status
from sqlalchemy import select, update, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.document import Document
from app.schemas.document import (
    AutoFillRequest,
    AutoFillResponse,
    DocumentList,
    DocumentOut,
    DocumentUploadResponse,
    DocumentVerifyRequest,
    OCRResult,
)
from app.utils.dependencies import get_current_user, get_admin_user
from app.utils.ocr_processor import OCRProcessor

router = APIRouter(prefix="/documents", tags=["Documents"])


def get_ocr_processor(request: Request) -> OCRProcessor:
    if not hasattr(request.app.state, "ocr_processor"):
        request.app.state.ocr_processor = OCRProcessor()
    return request.app.state.ocr_processor


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    citizen_id: uuid.UUID = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ocr: OCRProcessor = Depends(get_ocr_processor),
):
    allowed_mimes = settings.ALLOWED_MIME_TYPES.split(",")
    if file.content_type and file.content_type not in allowed_mimes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Allowed: {settings.ALLOWED_MIME_TYPES}",
        )

    file_data = await file.read()
    if len(file_data) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit",
        )

    allowed_types = [
        "aadhaar", "income_certificate", "land_record",
        "bank_passbook", "photo", "signature", "other",
    ]
    if document_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type. Must be one of: {', '.join(allowed_types)}",
        )

    file_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    storage_path = f"documents/{citizen_id}/{document_type}/{uuid.uuid4()}.{file_ext}"

    uploaded = await ocr.upload_to_gcs(file_data, storage_path, file.content_type or "application/octet-stream")
    if not uploaded:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to storage",
        )

    ocr_result = None
    if document_type in ("aadhaar", "income_certificate", "land_record", "bank_passbook"):
        ocr_result_data = await ocr.process_document(file_data, document_type)
        ocr_result = OCRResult(**ocr_result_data)

    document = Document(
        citizen_id=citizen_id,
        document_type=document_type,
        original_filename=file.filename or "untitled",
        storage_path=storage_path,
        file_size=len(file_data),
        mime_type=file.content_type,
        ocr_extracted_data=ocr_result.extracted_fields if ocr_result else None,
        ocr_confidence=ocr_result.confidence if ocr_result else None,
        ocr_processed_at=datetime.now(timezone.utc) if ocr_result else None,
        verification_status="pending",
    )
    db.add(document)
    await db.flush()

    return DocumentUploadResponse(
        id=document.id,
        filename=document.original_filename,
        document_type=document.document_type,
        file_size=document.file_size,
        ocr_result=ocr_result,
    )


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.is_deleted == False)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentOut.model_validate(doc)


@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ocr: OCRProcessor = Depends(get_ocr_processor),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.is_deleted == False)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    url = await ocr.generate_presigned_url(doc.storage_path, settings.GCS_PRESIGNED_URL_EXPIRY)
    if not url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL",
        )
    return {"download_url": url, "expires_in": settings.GCS_PRESIGNED_URL_EXPIRY}


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.is_deleted == False)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.is_deleted = True
    return None


@router.post("/{document_id}/verify", response_model=DocumentOut)
async def verify_document(
    document_id: uuid.UUID,
    body: DocumentVerifyRequest,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.is_deleted == False)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.verification_status = body.status
    doc.verified_by = body.verified_by
    return DocumentOut.model_validate(doc)


@router.post("/{document_id}/reprocess", response_model=DocumentOut)
async def reprocess_document(
    document_id: uuid.UUID,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ocr: OCRProcessor = Depends(get_ocr_processor),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.is_deleted == False)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc.document_type not in ("aadhaar", "income_certificate", "land_record", "bank_passbook"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OCR reprocessing not supported for document type: {doc.document_type}",
        )

    if not ocr.bucket:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloud storage not configured",
        )

    try:
        blob = ocr.bucket.blob(doc.storage_path)
        file_data = blob.download_as_bytes()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file from storage: {str(e)}",
        )

    ocr_result = await ocr.process_document(file_data, doc.document_type)
    doc.ocr_extracted_data = ocr_result.get("extracted_fields")
    doc.ocr_confidence = ocr_result.get("confidence")
    doc.ocr_processed_at = datetime.now(timezone.utc)

    return DocumentOut.model_validate(doc)


@router.get("/{document_id}/extract", response_model=OCRResult)
async def get_ocr_extract(
    document_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.is_deleted == False)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if not doc.ocr_extracted_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No OCR data available")

    return OCRResult(
        raw_text="",
        extracted_fields=doc.ocr_extracted_data or {},
        confidence=doc.ocr_confidence or 0.0,
        document_type=doc.document_type,
        processor_used="stored",
    )


@router.post("/autofill", response_model=AutoFillResponse)
async def autofill_form(
    body: AutoFillRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).where(
        Document.citizen_id == body.citizen_id,
        Document.is_deleted == False,
        Document.verification_status == "verified",
        Document.ocr_extracted_data.isnot(None),
    )
    if body.document_types:
        query = query.where(Document.document_type.in_(body.document_types))

    result = await db.execute(query)
    docs = result.scalars().all()

    filled_data = {}
    missing_fields = []
    confidences = []

    for doc in docs:
        if not doc.ocr_extracted_data:
            continue
        for field in body.form_fields:
            if field in doc.ocr_extracted_data and doc.ocr_extracted_data[field]:
                if field not in filled_data:
                    filled_data[field] = doc.ocr_extracted_data[field]
                    if doc.ocr_confidence:
                        confidences.append(doc.ocr_confidence)

    for field in body.form_fields:
        if field not in filled_data:
            missing_fields.append(field)

    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    return AutoFillResponse(
        filled_data=filled_data,
        missing_fields=missing_fields,
        confidence_score=avg_confidence,
    )
