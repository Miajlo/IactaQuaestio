if __name__ == "__main__":
    import uvicorn

    print("\n=== Starting server on port 1738 ===\n")

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=1738,
        reload=True
    )