import pandas as pd
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def extract_csv_variables(path: str, row_index: int = 0) -> Dict[str, Any]:
    """
    Mengekstrak variables dari file CSV berdasarkan row tertentu.
    
    Args:
        path: Path ke file CSV
        row_index: Index baris yang akan diekstrak (default: 0 untuk header + first data row)
        
    Returns:
        Dictionary dengan key-value pairs dari CSV row
    """
    try:
        df = pd.read_csv(path)
        
        if df.empty:
            logger.warning(f"CSV file is empty: {path}")
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
        logger.error(f"Error extracting CSV variables from {path}: {str(e)}")
        raise


def extract_csv_rows(path: str) -> List[Dict[str, Any]]:
    """
    Mengekstrak semua rows dari CSV sebagai list of dictionaries.
    
    Args:
        path: Path ke file CSV
        
    Returns:
        List of dictionaries, setiap dict mewakili satu row
    """
    try:
        df = pd.read_csv(path)
        
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
        logger.error(f"Error extracting CSV rows from {path}: {str(e)}")
        raise

