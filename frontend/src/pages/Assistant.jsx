import { useEffect, useRef, useState } from "react"
import apiClient from "../api/client"

function Assistant() {
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState("")

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    initializeConversation()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [messages, isTyping])

  const initializeConversation = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await apiClient.get(
        "/api/ai/conversations"
      )

      const conversations =
        response.data?.conversations || []

      let conversation

      if (conversations.length > 0) {
        conversation = conversations[0]
      } else {
        const createResponse =
          await apiClient.post(
            "/api/ai/conversations",
            {
              title: "Job Search Assistant",
            }
          )

        conversation = createResponse.data
      }

      setConversationId(conversation.id)

      const messagesResponse =
        await apiClient.get(
          `/api/ai/conversations/${conversation.id}/messages`
        )

      const history =
        messagesResponse.data?.messages || []

      const visibleMessages = history
        .filter(
          (message) =>
            message.role === "user" ||
            message.role === "assistant"
        )
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        }))

      if (visibleMessages.length > 0) {
        setMessages(visibleMessages)
      } else {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Welcome to Salahkaar. I can help you understand your job matches, improve your resume, identify skill gaps and review your application pipeline.",
          },
        ])
      }
    } catch (err) {
      console.error(
        "Failed to initialize assistant:",
        err
      )

      const detail = err.response?.data?.detail

      setError(
        detail ||
          "Unable to connect to the assistant."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    const message = input.trim()

    if (
      !message ||
      isTyping ||
      !conversationId
    ) {
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    }

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])

    setInput("")
    setIsTyping(true)
    setError("")

    try {
      const response =
        await apiClient.post(
          `/api/ai/conversations/${conversationId}/chat`,
          {
            message,
            job_id: null,
          }
        )

      const assistantMessage =
        response.data?.message

      if (!assistantMessage) {
        throw new Error(
          "Assistant returned an empty response."
        )
      }

      setMessages((previous) => [
        ...previous,
        {
          id: assistantMessage.id,
          role: "assistant",
          content:
            assistantMessage.content,
        },
      ])
    } catch (err) {
      console.error(
        "Assistant error:",
        err
      )

      const detail =
        err.response?.data?.detail

      setError(
        detail ||
          "Unable to get a response right now."
      )
    } finally {
      setIsTyping(false)

      setTimeout(() => {
        textareaRef.current?.focus()
      }, 50)
    }
  }

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (text) => {
    setInput(text)

    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
  }

  const clearConversation = async () => {
    try {
      setError("")

      const response =
        await apiClient.post(
          "/api/ai/conversations",
          {
            title: "Job Search Assistant",
          }
        )

      const newConversation =
        response.data

      setConversationId(
        newConversation.id
      )

      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content:
            "New conversation started. What would you like to work on?",
        },
      ])

      setInput("")
    } catch (err) {
      console.error(
        "Failed to create conversation:",
        err
      )

      setError(
        err.response?.data?.detail ||
          "Unable to start a new conversation."
      )
    }
  }

  const suggestedPrompts = [
    {
      number: "01",
      title: "Best matches",
      text:
        "Which jobs are the best match for my profile?",
    },
    {
      number: "02",
      title: "Resume review",
      text:
        "How can I improve my resume for tech jobs?",
    },
    {
      number: "03",
      title: "Skill gaps",
      text:
        "Which skills should I learn to get better job matches?",
    },
    {
      number: "04",
      title: "Applications",
      text:
        "Show me my current applications.",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-48px)] bg-[#f7f7f5] px-5 py-8 md:px-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-3 w-32 rounded bg-gray-200" />

          <div className="mt-4 h-10 w-72 rounded bg-gray-200" />

          <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-200" />

          <div className="mt-8 grid min-h-[650px] rounded-3xl border border-gray-200 bg-white">
            <div className="h-20 border-b border-gray-200" />
            <div className="flex-1" />
            <div className="h-40 border-t border-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#f7f7f5] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Personal career intelligence
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 md:text-4xl">
              Assistant
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              A focused workspace for your job search,
              resume and career decisions.
            </p>
          </div>

          <button
            type="button"
            onClick={clearConversation}
            disabled={isTyping}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            New conversation
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* CHAT */}
        <section className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white">

          {/* CHAT HEADER */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 md:px-6">

            <div className="flex items-center gap-3">

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
                <span className="absolute h-5 w-5 rounded-full border-2 border-white" />
                <span className="absolute h-2 w-2 rounded-full bg-white" />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-950">
                  Salahkaar Assistant
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  Career workspace
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

              <span className="text-xs font-semibold text-emerald-700">
                Connected
              </span>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="h-[500px] overflow-y-auto bg-[#fbfbfa] px-5 py-6 md:px-8">

            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-md text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Career intelligence
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
                    What are you working on?
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    Ask about your profile, applications,
                    skill gaps or job matches.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">

              {messages.map((message) => {
                const isUser =
                  message.role === "user"

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] md:max-w-[75%] ${
                        isUser
                          ? "items-end"
                          : "items-start"
                      }`}
                    >

                      <div
                        className={`mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          isUser
                            ? "text-right text-gray-400"
                            : "text-gray-400"
                        }`}
                      >
                        {isUser
                          ? "You"
                          : "Salahkaar"}
                      </div>

                      <div
                        className={`whitespace-pre-wrap rounded-2xl px-4 py-3.5 text-sm leading-6 ${
                          isUser
                            ? "rounded-br-sm bg-gray-950 text-white"
                            : "rounded-bl-sm border border-gray-200 bg-white text-gray-700"
                        }`}
                      >
                        {message.content}
                      </div>

                    </div>
                  </div>
                )
              })}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[75%]">

                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                      Salahkaar
                    </div>

                    <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-5 py-4">
                      <div className="flex gap-1.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />

                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                          style={{
                            animationDelay: "150ms",
                          }}
                        />

                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                          style={{
                            animationDelay: "300ms",
                          }}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* SUGGESTIONS */}
          <div className="border-t border-gray-200 bg-white px-5 py-5 md:px-6">

            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Suggested questions
              </p>

              <span className="text-xs text-gray-400">
                Click to use
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">

              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt.number}
                  type="button"
                  onClick={() =>
                    handleSuggestion(prompt.text)
                  }
                  className="rounded-2xl border border-gray-200 bg-[#fbfbfa] p-4 text-left transition hover:border-gray-400 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">

                    <span className="text-[10px] font-semibold tracking-[0.16em] text-gray-400">
                      {prompt.number}
                    </span>

                    <span className="text-gray-400">
                      ↗
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-semibold text-gray-950">
                    {prompt.title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {prompt.text}
                  </p>
                </button>
              ))}

            </div>
          </div>

          {/* INPUT */}
          <div className="border-t border-gray-200 bg-white p-4 md:p-5">

            <div className="rounded-2xl border border-gray-300 bg-white transition focus-within:border-gray-500">

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                placeholder="Ask about your career, jobs, resume or applications..."
                rows={2}
                className="min-h-[64px] w-full resize-none border-0 bg-transparent px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
              />

              <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">

                <p className="text-[11px] text-gray-400">
                  Enter to send · Shift + Enter for a new line
                </p>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    !input.trim() ||
                    isTyping ||
                    !conversationId
                  }
                  className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Send
                  <span className="ml-2">↗</span>
                </button>

              </div>
            </div>

          </div>
        </section>

        <p className="mt-4 text-center text-xs text-gray-400">
          Salahkaar uses the information stored in your career workspace to provide personalized guidance.
        </p>

      </div>
    </div>
  )
}

export default Assistant