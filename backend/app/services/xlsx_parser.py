import pandas as pd
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def extract_xlsx_variables(
    path: str, sheet_name: str = "", row_index: int = 0
) -> Dict[str, Any]:
    """
    Mengekstrak variables dari file XLSX berdasarkan row tertentu.

    Args:
        path: Path ke file XLSX
        sheet_name: Nama sheet yang akan dibaca (default: sheet pertama)
        row_index: Index baris yang akan diekstrak (default: 0 untuk first data row)

    Returns:
        Dictionary dengan key-value pairs dari XLSX row
    """
    try:
        if sheet_name:
            df = pd.read_excel(path, sheet_name=sheet_name)
        else:
            df = pd.read_excel(path, sheet_name=0)

        if df.empty:
            logger.warning(f"XLSX file or sheet is empty: {path}")
            return {}

        if row_index >= len(df):
            logger.warning(f"Row index {row_index} out of range. Using first row.")
            row_index = 0

        row_data = df.iloc[row_index].to_dict()

        variables = {}
        for key, value in row_data.items():
            key_clean = str(key).strip().lower().replace(" ", "_")
            variables[key_clean] = str(value) if pd.notna(value) else ""

        return variables

    except Exception as e:
        logger.error(f"Error extracting XLSX variables from {path}: {str(e)}")
        raise


def extract_xlsx_rows(path: str, sheet_name: str = "") -> List[Dict[str, Any]]:
    """
    Mengekstrak semua rows dari XLSX sebagai list of dictionaries.

    Args:
        path: Path ke file XLSX
        sheet_name: Nama sheet yang akan dibaca (default: sheet pertama)

    Returns:
        List of dictionaries, setiap dict mewakili satu row
    """
    try:
        if sheet_name:
            df = pd.read_excel(path, sheet_name=sheet_name)
        else:
            df = pd.read_excel(path, sheet_name=0)

        if df.empty:
            return []

        rows = []
        for _, row in df.iterrows():
            row_dict = {}
            for key, value in row.items():
                key_clean = str(key).strip()
                row_dict[key_clean] = str(value) if pd.notna(value) else ""
            rows.append(row_dict)

        return rows

    except Exception as e:
        logger.error(f"Error extracting XLSX rows from {path}: {str(e)}")
        raise


def get_xlsx_sheets(path: str) -> List[str]:
    """
    Mendapatkan daftar nama sheet dari file XLSX.

    Args:
        path: Path ke file XLSX

    Returns:
        List of sheet names
    """
    excel_file = pd.ExcelFile(path)
    try:
        return [str(sheet) for sheet in excel_file.sheet_names if isinstance(sheet, str)]
    finally:
        excel_file.close()
