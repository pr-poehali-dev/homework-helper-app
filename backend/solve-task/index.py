import json
import os
import urllib.request
import urllib.error


def handler(event, context):
    """Решает школьную задачу по фотографии через GPT-4o vision"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    cors = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body)
    image_base64 = body.get('image', '')

    if not image_base64:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'No image provided'})}

    if ',' in image_base64:
        image_base64 = image_base64.split(',', 1)[1]

    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'API key not configured'})}

    payload = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "system",
                "content": (
                    "Ты — опытный школьный репетитор. Посмотри на фото с заданием и реши его пошагово.\n"
                    "Формат ответа (строго JSON):\n"
                    "{\n"
                    '  "subject": "Предмет (Математика / Физика / Химия / Русский язык / и т.д.)",\n'
                    '  "task": "Краткое описание задачи (1 строка)",\n'
                    '  "steps": ["Шаг 1: ...", "Шаг 2: ...", ...],\n'
                    '  "answer": "Итоговый ответ"\n'
                    "}\n"
                    "Отвечай ТОЛЬКО валидным JSON, без markdown-обёрток."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Реши это задание пошагово:"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}",
                        },
                    },
                ],
            },
        ],
        "max_tokens": 2000,
        "temperature": 0.2,
    }

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        return {
            'statusCode': 502,
            'headers': cors,
            'body': json.dumps({'error': f'OpenAI error: {e.code}', 'details': error_body}),
        }

    content = result['choices'][0]['message']['content'].strip()

    if content.startswith('```'):
        content = content.split('\n', 1)[1] if '\n' in content else content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()

    try:
        solution = json.loads(content)
    except json.JSONDecodeError:
        solution = {
            "subject": "Общее",
            "task": "Задание с фото",
            "steps": [content],
            "answer": "См. решение выше",
        }

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps(solution, ensure_ascii=False),
    }
