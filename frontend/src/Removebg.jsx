import { useState } from "react";
import axios from "axios";

export default function RemoveBg() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setdragActive] = useState(false);
    const [showbgOptions, setshowbgOptions] = useState(false);
    const [bgColor, setbgColor] = useState(null);
    const [bgImage, setbgImage] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setResult(null);
    };


    const handleRemoveBg = async () => {
        if (!file) return alert("Please select an image");

        const formData = new FormData();
        formData.append("image", file);

        try {
            setLoading(true);

            const res = await axios.post(
                "http://localhost:5000/remove-bg",
                formData,
                {
                    responseType: "blob",
                }
            );

            const imageUrl = URL.createObjectURL(res.data);
            setResult(imageUrl);
        } catch (error) {
            console.error(error);
            alert("Error removing background");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadbg = async () => {
        if (!result) return;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            if (bgImage) {
                const bgImg = new Image();
                bgImg.onload = () => {
                    ctx.drawImage(bgImg, 0, 0, img.width, img.height);
                    ctx.drawImage(img, 0, 0, img.width, img.height);

                    const finalImage = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = finalImage;
                    link.download = "edited-image.png";
                    link.click();
                };
                bgImg.src = bgImage;
                return;
            }

            if (bgColor) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, img.width, img.height);
            }

            ctx.drawImage(img, 0, 0, img.width, img.height);

            const finalImage = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = finalImage;
            link.download = "edited-image.png";
            link.click();
        };
        img.src = result;
    };

    return (
        <>
            <div className="container">
                <div className="card">
                    <h2>Remove Background</h2>
                    <p className="subtitle">
                        Upload an image and get a transparent background instantly
                    </p>

                    <div
                        className={`drop-zone ${dragActive ? "active" : ""}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setdragActive(true);
                        }}
                        onDragLeave={() => setdragActive(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setdragActive(false);

                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile) {
                                setFile(droppedFile);
                                setPreview(URL.createObjectURL(droppedFile));
                                setResult(null);
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

                                    <div style={{
                                        borderRadius: "8px"
                                    }}>
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
                                        <div style={{
                                            backgroundColor: bgColor || "transparent",
                                            backgroundImage: bgImage ? `url(${bgImage})` : "none",
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            borderRadius: "8px"
                                        }}>
                                            <img src={result} alt="result" />
                                        </div>

                                        <button className="download-btn"
                                            onClick={handleDownloadbg}>
                                            Download
                                        </button>

                                        <button className="btn"
                                            style={{ margin: "10px 20px" }}
                                            onClick={() => setshowbgOptions((prev) => !prev)}
                                        >
                                            {showbgOptions ? "Hide Background Options" : "Edit Background"}
                                        </button>

                                        {showbgOptions && (
                                            <div style={{ marginTop: "10px" }}>
                                                <input type="color"
                                                    value={bgColor}
                                                    onChange={(e) => setbgColor(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {showbgOptions && (
                                            <div style={{ marginTop: "10px" }}>
                                                <input type="file" accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setbgImage(URL.createObjectURL(file))
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