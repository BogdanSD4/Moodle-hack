function setCookie(name, value) {
    document.cookie = name + "=" + JSON.stringify(value) + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) == 0) {
            return JSON.parse(cookie.substring(nameEQ.length, cookie.length));
        }
    }
    return null;
}
function getGPTKey() {
    fetch('config.json')
        .then(response => response.json())
        .then(data => {
            // Ваши данные из JSON файла находятся в переменной 'data'
            return data.gptApiKey;
        })
        .catch(error => console.error('Ошибка при получении данных: ', error));
}
const apiUrl = "https://api.openai.com/v1/chat/completions";
const apiKey = getGPTKey;

const gptPack = {
    apiKey: apiKey,
    apiUrl: apiUrl,
}
//question tag: qtext
//answer tag: flex-fill

window.addEventListener('load', function () {
    const question = document.getElementById("question");
    const answer = document.getElementById("answer");

    var data = getCookie("data");

    question.value = data == null ? "qtext" : data.question == "" ? "qtext" : data.question;
    answer.value = data == null ? "flex-fill" : data.answer == "" ? "flex-fill" : data.answer;


});

const startBtn = document.getElementById("startBtn");
startBtn.addEventListener("click", () => {

    const question = document.getElementById("question");
    const answer = document.getElementById("answer");

    var dataToWrite = {
        "question": question.value,
        "answer": answer.value
    };

    setCookie("data", dataToWrite);

    chrome.tabs.query({ active: true }, (tabs) => {
        const tab = tabs[0];
        if (tab) {
            const tabId = tab.id;

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (cookieValue, gptPack) => {

                    var question = document.getElementsByClassName(cookieValue.question);
                    var answers = document.getElementsByClassName(cookieValue.answer);

                    var baseText = "Write the correct answer to the question. Do not write anything extra, only one answer option:\n\n";
                    var result = baseText + question[0].textContent + "\n";

                    var arr = ["a) ", "b) ", "c) ", "d) "]

                    for (var i = 0; i < answers.length; i++) {
                        result += arr[i] + answers[i].textContent + "\n";
                    }

                    console.log(result);

                    const requestOptions = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${gptPack.apiKey}`

                        },
                        body: JSON.stringify({
                            model: "gpt-3.5-turbo-0613",
                            messages: [
                                { role: "user", content: result }
                            ],
                        })
                    };

                    fetch(gptPack.apiUrl, requestOptions)
                        .then(response => response.json())
                        .then(output => {
                            const explanation = output.choices[0].message.content;
                            console.log(output);
                            console.log(explanation);
                            alert(new TextDecoder('utf-8').decode(new TextEncoder().encode(explanation)));
                        })
                        .catch(error => console.log(error));
                },
                args: [dataToWrite, gptPack]
            });

        } else {
            alert("There are no active tabs")
        }
    })
})

