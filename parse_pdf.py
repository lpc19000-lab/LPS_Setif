import PyPDF2

def extract_text():
    try:
        reader = PyPDF2.PdfReader('algeria_69_provinces_communes.pdf')
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        with open('raw_pdf_text.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        print("Successfully extracted PDF text to raw_pdf_text.txt")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_text()
