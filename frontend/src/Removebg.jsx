import { useState } from "react";
import axios from "axios";

export default function RemoveBg() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showBgOptions, setShowBgOptions] = useState(false);
    const [bgColor, setBgColor] = useState("#ffffff");
    const [bgImage, setBgImage] = useState(null);
    const [error, setError] = useState(null); 

    const isValidImage = (file) => {
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            setError("Please upload a valid image (JPEG, PNG, WebP, or GIF)");
            return false;
        }
        if (file.size > maxSize) {
            setError("Image size must be less than 10MB");
            return false;
        }
        return true;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!isValidImage(selectedFile)) return;

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setResult(null);
        setBgColor("#ffffff");
        setBgImage(null);
        setShowBgOptions(false);
        setError(null);
    };

    const handleRemoveBg = async () => {
        if (!file) {
            setError("Please select an image");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(
                "https://backgroundremover-fe3c.onrender.com/remove-bg",
                formData,
                {
                    responseType: "blob",
                    timeout: 60000, 
                }
            );

            const imageUrl = URL.createObjectURL(res.data);
            setResult(imageUrl);
        } catch (error) {
            console.error("Error removing background:", error);

            if (error.response?.status === 400) {
                setError("Invalid image file. Please try a different image.");
            } else if (error.response?.status === 500) {
                setError("Server error. Please check your API key and try again.");
            } else if (error.code === "ECONNABORTED") {
                setError("Request timeout. Image may be too large.");
            } else {
                setError(error.message || "Error removing background. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBg = async () => {
        if (!result) return;

        try {
            const response = await fetch(result);
            const blob = await response.blob();

            const img = new Image();
            img.src = URL.createObjectURL(blob);

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                const height = img.height;
                const width = img.width;

                canvas.width = width;
                canvas.height = height;

                if (bgImage) {
                    const bgImg = new Image();
                    bgImg.crossOrigin = "anonymous";
                    bgImg.src = bgImage;

                    bgImg.onload = () => {
                        ctx.drawImage(bgImg, 0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);
                        downloadCanvas(canvas);
                    };

                    bgImg.onerror = () => {
                        setError("Failed to load background image");
                    };
                    return;
                }

                if (bgColor) {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, width, height);
                }

                ctx.drawImage(img, 0, 0, width, height);
                downloadCanvas(canvas);
            };

            img.onerror = () => {
                setError("Failed to process image");
            };
        } catch (error) {
            console.error("Download error:", error);
            setError("Error downloading image");
        }
    };

    const downloadCanvas = (canvas) => {
        const finalImage = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = finalImage;
        link.download = `bg-removed-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="container">
                <div className="card">
                    <h2>Remove Background</h2>
                    <p className="subtitle">
                        Upload an image and get a transparent background instantly
                    </p>

                    
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div
                        className={`drop-zone ${dragActive ? "active" : ""}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragActive(false);

                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile && isValidImage(droppedFile)) {
                                setFile(droppedFile);
                                setPreview(URL.createObjectURL(droppedFile));
                                setResult(null);
                                setError(null);
                            }
                        }}
                        onClick={() => document.getElementById("fileInput").click()}
                    >
                        <p>Drag & Drop Image Here</p>
                        <span>or click to upload</span>

                        <input
                            id="fileInput"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            hidden
                        />
                    </div>

                    <button
                        onClick={handleRemoveBg}
                        className="btn"
                        disabled={!file || loading}
                    >
                        {loading ? "Processing..." : "Remove Background"}
                    </button>

                    {(preview || result) && (
                        <div className="image-grid">
                            {preview && (
                                <div className="image-box">
                                    <p>Original</p>
                                    <div style={{ borderRadius: "8px" }}>
                                        <img src={preview} alt="preview" />
                                    </div>
                                </div>
                            )}

                            <div className="image-box">
                                <p>Result</p>

                                {loading ? (
                                    <div className="loader"></div>
                                ) : result ? (
                                    <>
                                        <div
                                            style={{
                                                backgroundColor: bgColor || "transparent",
                                                backgroundImage: bgImage
                                                    ? `url(${bgImage})`
                                                    : "none",
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                                borderRadius: "8px",
                                            }}
                                        >
                                            <img src={result} alt="result" />
                                        </div>

                                        <button
                                            className="download-btn"
                                            onClick={handleDownloadBg}
                                        >
                                            Download
                                        </button>

                                        <button
                                            className="btn"
                                            style={{ margin: "10px 20px" }}
                                            onClick={() => setShowBgOptions((prev) => !prev)}
                                        >
                                            {showBgOptions
                                                ? "Hide Background Options"
                                                : "Edit Background"}
                                        </button>

                                        {showBgOptions && (
                                            <div style={{ marginTop: "10px" }}>
                                                <label>Background Color:</label>
                                                <input
                                                    type="color"
                                                    value={bgColor || "#ffffff"}
                                                    onChange={(e) => {
                                                        setBgColor(e.target.value);
                                                        setBgImage(null); 
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {showBgOptions && (
                                            <div style={{ marginTop: "10px" }}>
                                                <label>Background Image:</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file && isValidImage(file)) {
                                                            setBgImage(
                                                                URL.createObjectURL(file)
                                                            );
                                                            setBgColor(null); 
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="placeholder">
                                        Upload an image to see result
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}