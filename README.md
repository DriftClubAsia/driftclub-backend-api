# Driftclub Backend API

This project uses Next.js API routes to serve data.

## OpenAI Chat Endpoint

A new API route is available at `/api/chat`.  It expects a POST request with a JSON body containing an array of ChatGPT-style `messages`.

Example request body:

```json
{
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

The response will contain the assistant's message in an `answer` field.

Set the `OPENAI_API_KEY` environment variable so the route can access the OpenAI API.

## Using with Botpress

Create a custom action or hook in Botpress that makes a POST request to `/api/chat` and sends the conversation messages.  Parse the `answer` field from the response and continue the workflow with that text.


