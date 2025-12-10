from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.services.csv_parser import extract_csv_rows, extract_csv_variables
from app.services.xlsx_parser import extract_xlsx_rows, get_xlsx_sheets, extract_xlsx_variables
from app.utils.file_handler import save_temp_file, cleanup_temp
from typing import Optional

router = APIRouter()


@router.post("/extract-rows")
async def extract_all_rows(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Query(None, description="Sheet name untuk XLSX"),
):
    """
    Endpoint untuk mengekstrak semua rows dari CSV/XLSX.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_ext = None
    filename_lower = file.filename.lower()

    if filename_lower.endswith(".csv"):
        file_ext = ".csv"
    elif filename_lower.endswith(".xlsx"):
        file_ext = ".xlsx"
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only CSV and XLSX are supported.",
        )

    temp_path = None
    try:
        temp_path = save_temp_file(file)

        if file_ext == ".csv":
            rows = extract_csv_rows(temp_path)
        else:
            target_sheet_name = sheet_name if sheet_name is not None else ""
            rows = extract_xlsx_rows(temp_path, target_sheet_name)

        return {
            "success": True,
            "filename": file.filename,
            "rows": rows,
            "total_rows": len(rows),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting rows: {str(e)}")
    finally:
        if temp_path:
            cleanup_temp(temp_path)


@router.post("/xlsx-sheets")
async def get_sheets(file: UploadFile = File(...)):
    """
    Endpoint untuk mendapatkan daftar sheet dari file XLSX.
    """
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="XLSX file is required")

    temp_path = None
    try:
        temp_path = save_temp_file(file)
        sheets = get_xlsx_sheets(temp_path)

        return {"success": True, "filename": file.filename, "sheets": sheets}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading sheets: {str(e)}")
    finally:
        if temp_path:
            cleanup_temp(temp_path)
