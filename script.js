const webllm = window.webllm;

// Задаем выбранную Вариант 1 русскую модель Qwen 1.5B (весит около 950 МБ)
const selectedModel = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

let engine;
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const statusDiv = document.getElementById("status");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.getElementById("progress-container");

let chatHistory = [];

async function initAI() {
    try {
        progressContainer.classList.remove("hidden");
        
        // Запуск движка и отслеживание процесса скачивания модели с Hugging Face
        engine = await webllm.CreateMLCEngine(
            selectedModel,
            {
                initProgressCallback: (report) => {
                    statusDiv.innerText = report.text;
                    if (report.progress !== undefined) {
                        progressBar.style.width = `${report.progress * 100}%`;
                    }
                }
            }
        );

        // Когда 950 МБ скачались в память устройства, разблокируем интерфейс
        statusDiv.innerText = "Готов к работе. Интернет можно отключать!";
        statusDiv.style.color = "#34c759";
        progressContainer.classList.add("hidden");
        userInput.disabled = false;
        sendBtn.disabled = false;

    } catch (error) {
        statusDiv.innerText = "Ошибка. Убедитесь, что в браузере включено WebGPU / аппаратное ускорение.";
        statusDiv.style.color = "#ff3b30";
        console.error(error);
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, "user");
    userInput.value = "";
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Сохраняем реплику пользователя для памяти контекста
    chatHistory.push({ role: "user", content: text });

    const aiMessageDiv = appendMessage("ИИ думает...", "ai");

    try {
        // Локальная генерация ответа силами процессора/видеокарты планшета
        const reply = await engine.chat.completions.create({
            messages: chatHistory
        });

        const aiResponse = reply.choices[0].message.content;
        aiMessageDiv.innerText = aiResponse;

        // Сохраняем ответ ИИ в историю
        chatHistory.push({ role: "assistant", content: aiResponse });

    } catch (error) {
        aiMessageDiv.innerText = "❌ Не удалось сгенерировать ответ.";
        console.error(error);
    }

    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
}

function appendMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.innerText = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv;
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

initAI();
