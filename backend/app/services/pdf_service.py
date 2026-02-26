# Сервис парсинга PDF резюме через pdfplumber
import io
import logging
import pdfplumber

logger = logging.getLogger(__name__)


async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Извлекает текст из PDF файла резюме.
    
    Args:
        file_bytes: Бинарное содержимое PDF файла
        
    Returns:
        Весь текст из PDF одной строкой
        
    Raises:
        ValueError: Если PDF пуст или не удалось извлечь текст
    """
    try:
        text_parts: list[str] = []
        
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            if len(pdf.pages) == 0:
                raise ValueError("PDF файл не содержит страниц")
            
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
                    logger.debug(f"Страница {page_num + 1}: извлечено {len(page_text)} символов")
        
        full_text = "\n\n".join(text_parts).strip()
        
        if not full_text:
            raise ValueError("Не удалось извлечь текст из PDF. Возможно, это сканированный документ.")
        
        logger.info(f"PDF успешно обработан: {len(full_text)} символов, {len(pdf.pages)} страниц")
        return full_text
        
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Ошибка обработки PDF: {e}")
        raise ValueError(f"Ошибка чтения PDF файла: {str(e)}")


def validate_pdf_size(file_bytes: bytes, max_mb: int = 10) -> None:
    """Проверяет размер PDF файла."""
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > max_mb:
        raise ValueError(f"Файл слишком большой: {size_mb:.1f} МБ. Максимум: {max_mb} МБ")
