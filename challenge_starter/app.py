import sys
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root is on path
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Import routers
from api.fl_routes import router as fl_router
from api.attack_routes import router as attack_router
from api.defense_routes import router as defense_router
from api.model_routes import router as model_router
from api.results_routes import router as results_router
from api.operator_routes import router as operator_router
from api.predict_routes import router as predict_router

app = FastAPI(
    title="FL Backdoor Attack & Defense Demo",
    description="Interactive demo system for IEEE GSC26 Challenge 1 — Federated Learning Backdoor Attack & Defense",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Mount API routers
app.include_router(fl_router)
app.include_router(attack_router)
app.include_router(defense_router)
app.include_router(model_router)
app.include_router(results_router)
app.include_router(operator_router)
app.include_router(predict_router)

# Serve React frontend assets
frontend_dist = ROOT / "frontend" / "dist"

if frontend_dist.is_dir() and (frontend_dist / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

@app.get("/")
async def root():
    index = frontend_dist / "index.html"
    if index.exists():
        return FileResponse(str(index), headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
    return {"message": "FL Demo API is running. Frontend not built yet — run: cd frontend && npm run build"}

@app.get("/favicon.ico")
async def favicon():
    fav = frontend_dist / "favicon.ico"
    if fav.exists():
        return FileResponse(str(fav))
    return Response(status_code=204)

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    # Return 404 JSON for missing API calls
    if full_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
    # Return 404 for missing asset requests
    if full_path.startswith("assets/"):
        return Response(status_code=404)
    # All other paths → serve the SPA shell so client-side routing works
    index = frontend_dist / "index.html"
    if index.exists():
        return FileResponse(str(index), headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
    return {"message": "FL Demo API is running."}


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("  FL Backdoor Attack & Defense Demo System")
    print("  IEEE GSC26 Challenge 1 — Team 004")
    print("=" * 60)
    print(f"  Server: http://localhost:8000")
    print(f"  API docs: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000)
