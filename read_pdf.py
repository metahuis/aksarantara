import fitz
import sys

def read_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(read_pdf(sys.argv[1]))
    else:
        print("Please provide a PDF file path")
