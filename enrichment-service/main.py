from fastapi import FastAPI
app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "service": "baldwin-prospectiq-enrichment"}

@app.get("/")
def root():
    return {"message": "Baldwin-ProspectIQ Enrichment", "version": "1.0.0"}
