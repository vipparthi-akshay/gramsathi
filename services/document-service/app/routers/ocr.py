import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentUploadResponse, OCRResult
from app.utils.dependencies import get_current_user
from app.utils.ocr_processor import OCRProcessor

router = APIRouter(prefix="/ocr", tags=["OCR Processing"])

DOCUMENT_TYPES = {
    "aadhaar": "aadhaar",
    "income": "income_certificate",
    "land-record": "land_record",
    "bank-passbook": "bank_passbook",
}


def get_ocr_processor(request: Request) -> OCRProcessor:
    if not hasattr(request.app.state, "ocr_processor"):
        request.app.state.ocr_processor = OCRProcessor()
    return request.app.state.ocr_processor


@router.post("/process", response_model=DocumentUploadResponse)
async def ocr_process(
    request: Request,
    citizen_id: uuid.UUID = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ocr: OCRProcessor = Depends(get_ocr_processor),
):
    allowed_types = ["aadhaar", "income_certificate", "land_record", "bank_passbook", "other"]
    if document_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type. Must be one of: {', '.join(allowed_types)}",
        )

    file_data = await file.read()
    file_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    storage_path = f"documents/{citizen_id}/{document_type}/{uuid.uuid4()}.{file_ext}"

    uploaded = await ocr.upload_to_gcs(file_data, storage_path, file.content_type or "application/octet-stream")
    if not uploaded:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to storage",
        )

    ocr_result_data = await ocr.process_document(file_data, document_type)
    ocr_result = OCRResult(**ocr_result_data)

    document = Document(
        citizen_id=citizen_id,
        document_type=document_type,
        original_filename=file.filename or "untitled",
        storage_path=storage_path,
        file_size=len(file_data),
        mime_type=file.content_type,
        ocr_extracted_data=ocr_result.extracted_fields,
        ocr_confidence=ocr_result.confidence,
        ocr_processed_at=datetime.now(timezone.utc),
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


@router.post("/aadhaar", response_model=DocumentUploadResponse)
async def ocr_aadhaar(
    request: Request,
    citizen_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ocr: OCRProcessor = Depends(get_ocr_processor),
):
    return await _process_specialized(request, citizen_id, "aadhaar", file, current_user, db, ocr)


@router.post("/income", response_model=DocumentUploadResponse)
async def ocr_income(
    request: Request,
    citizen_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ocr: OCRProcessor = Depends(get_ocr_processor),
):
    return await _process_specialized(request, citizen_id, "income_certificate", file, current_user, db, ocr)


@router.post("/land-record", response_model=DocumentUploadResponse)
async def ocr_land_record(
    request: Request,
    citizen_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ocr: OCRProcessor = Depends(get_ocr_processor),
):
    return await _process_specialized(request, citizen_id, "land_record", file, current_user, db, ocr)


@router.post("/bank-passbook", response_model=DocumentUploadResponse)
async def ocr_bank_passbook(
    request: Request,
    citizen_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ocr: OCRProcessor = Depends(get_ocr_processor),
):
    return await _process_specialized(request, citizen_id, "bank_passbook", file, current_user, db, ocr)


async def _process_specialized(
    request: Request,
    citizen_id: uuid.UUID,
    document_type: str,
    file: UploadFile,
    current_user: dict,
    db: AsyncSession,
    ocr: OCRProcessor,
):
    file_data = await file.read()
    file_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    storage_path = f"documents/{citizen_id}/{document_type}/{uuid.uuid4()}.{file_ext}"

    uploaded = await ocr.upload_to_gcs(file_data, storage_path, file.content_type or "application/octet-stream")
    if not uploaded:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to storage",
        )

    ocr_result_data = await ocr.process_document(file_data, document_type)
    ocr_result = OCRResult(**ocr_result_data)

    validation = await ocr.validate_extracted_data(ocr_result_data, document_type)

    document = Document(
        citizen_id=citizen_id,
        document_type=document_type,
        original_filename=file.filename or "untitled",
        storage_path=storage_path,
        file_size=len(file_data),
        mime_type=file.content_type,
        ocr_extracted_data=ocr_result.extracted_fields,
        ocr_confidence=ocr_result.confidence,
        ocr_processed_at=datetime.now(timezone.utc),
        verification_status="pending" if validation.get("is_valid") else "needs_review",
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
