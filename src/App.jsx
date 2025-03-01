// import React, { useState } from "react";
// import { ReactMic } from "react-mic";
// import axios from "axios";

// function App() {
//     const [isRecording, setIsRecording] = useState(false);
//     const [transcribedText, setTranscribedText] = useState("");
//     const [aiResponse, setAiResponse] = useState("");
//     const [audioUrl, setAudioUrl] = useState("");

//     // Start recording
//     const startRecording = () => {
//         setIsRecording(true);
//     };

//     // Stop recording
//     const stopRecording = () => {
//         setIsRecording(false);
//     };

//     // Handle audio data
//     const onData = (recordedBlob) => {
//         console.log("Recording...", recordedBlob);
//     };

//     // When recording is done
//     const onStop = async (recordedBlob) => {
//         console.log("Recording stopped:", recordedBlob);

//         // Create FormData to send to backend
//         const formData = new FormData();
//         formData.append("audio", recordedBlob.blob);

//         try {
//             // Send audio to backend for transcription
//             const { data } = await axios.post("http://localhost:5000/stt", formData);
//             setTranscribedText(data.text);

//             // Send text to AI model
//             const aiResponse = await axios.post("http://localhost:5000/ask", { text: data.text });
//             setAiResponse(aiResponse.data.answer);

//             // Convert AI response to speech
//             const ttsResponse = await axios.post("http://localhost:5000/tts", { text: aiResponse.data.answer });
//             setAudioUrl(ttsResponse.data.audioUrl);
//         } catch (error) {
//             console.error("Error processing audio", error);
//         }
//     };

//     return (
//         <div>
//             <h1>🎙 AI Voice Assistant</h1>
//             <button onClick={startRecording}>Start Recording</button>
//             <button onClick={stopRecording}>Stop Recording</button>

//             <ReactMic
//                 record={isRecording}
//                 className="sound-wave"
//                 onStop={onStop}
//                 onData={onData}
//                 mimeType="audio/webm" // Supports web browsers
//             />

//             <p><strong>Transcribed Text:</strong> {transcribedText}</p>
//             <p><strong>AI Response:</strong> {aiResponse}</p>
//             {audioUrl && <audio controls src={audioUrl}></audio>}
//         </div>
//     );
// }

// export default App;

import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [liveText, setLiveText] = useState(""); // Real-time transcription
    const [aiResponse, setAiResponse] = useState("");
    let recognition;

    // 🎙 Start recording with real-time transcription
    const startRecording = () => {
        setIsRecording(true);
        setLiveText(""); // Reset live text

        if ("webkitSpeechRecognition" in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                let transcript = "";
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript + " ";
                }
                setLiveText(transcript);
            };

            recognition.start();
        } else {
            alert("Speech recognition is not supported in your browser.");
        }
    };

    // 🛑 Stop recording and send text to backend
    const stopRecording = async () => {
        setIsRecording(false);
        if (recognition) {
            recognition.stop();
        }

        if (!liveText.trim()) {
            alert("No speech detected.");
            return;
        }

        try {
            // Send transcribed text to backend for AI processing
            const aiRes = await axios.post("http://localhost:5000/ask", { text: liveText });
            setAiResponse(aiRes.data.answer);

            // Speak out the AI-generated response
            speakText(aiRes.data.answer);
        } catch (error) {
            console.error("Error processing text", error);
        }
    };

    // 🔊 Function to Convert Text-to-Speech
    const speakText = (text) => {
        if (!window.speechSynthesis) {
            alert("Speech synthesis is not supported in your browser.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";  // Set language
        utterance.rate = 1;         // Speed (1 is normal, 0.5 is slow, 2 is fast)
        utterance.pitch = 1;        // Pitch (1 is normal)

        window.speechSynthesis.speak(utterance);
    };

    // 🗣 Get Available Voices
    const getVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log(voices); // Log available voices
    };

    useEffect(() => {
        getVoices();
    }, []);

    return (
        <div style={{ textAlign: "center", fontFamily: "Arial", padding: "20px" }}>
            <h1>🎙 AI Voice Assistant</h1>
            <button onClick={startRecording} disabled={isRecording}>Start Recording</button>
            <button onClick={stopRecording} disabled={!isRecording}>Stop Recording</button>

            <h2>Live Transcription:</h2>
            <p style={{ color: "blue", fontWeight: "bold" }}>{liveText}</p>

            {aiResponse && (
                <>
                    <h2>AI Response (Text):</h2>
                    <p>{aiResponse}</p>
                    <button onClick={() => speakText(aiResponse)}>🔊 Speak Again</button>
                </>
            )}
        </div>
    );
}

export  App;
