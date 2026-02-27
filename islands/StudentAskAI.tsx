import { useState, useEffect } from "preact/hooks";
import { marked } from "marked";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface StudentAskAIProps {
  user: {
    id: string;
    name: string;
    role: string;
    grade?: number;
  };
}

export default function StudentAskAI({ user }: StudentAskAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const storedMessages = localStorage.getItem(`ai_conversation_student_${user.id}`);
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error("Error loading messages from localStorage:", error);
      }
    }
  }, [user.id]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ai_conversation_student_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user.id]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage.content,
          grade: user.grade,
          role: user.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "Xin lỗi, có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.",
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem(`ai_conversation_student_${user.id}`);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMarkdown = (text: string) => {
    try {
      return { __html: marked.parse(text) };
    } catch (e) {
      return { __html: text };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic text-black">
                Hỏi AI Trợ Lý
              </h1>
              <p className="text-xs md:text-sm text-black font-bold uppercase tracking-tight opacity-70">
                AI trợ lý học tập thông minh cho học sinh
              </p>
            </div>
            <button
              onClick={() => window.location.href = "/student"}
              className="h-8 md:h-10 px-3 md:px-4 border-2 border-black font-black uppercase italic text-xs hover:bg-black hover:text-white transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="border-2 border-black shadow-neo bg-white h-[calc(100vh-200px)] md:h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl mb-2">🤖</div>
                  <p className="text-sm md:text-base font-black uppercase italic text-black opacity-70">
                    Xin chào! Tôi có thể giúp gì cho bạn?
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 mt-2">
                    Hãy hỏi tôi về bất kỳ vấn đề học tập nào
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] md:max-w-[70%] p-2 md:p-3 rounded-lg text-xs md:text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-black border-2 border-black'
                        : 'bg-gray-100 text-black border-2 border-gray-300'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={renderMarkdown(message.content)}
                      />
                    )}
                    <p className="text-[10px] opacity-60 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border-2 border-gray-300 p-2 md:p-3 rounded-lg text-xs md:text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent"></div>
                    <span>Đang suy nghĩ...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-black p-3 md:p-4">
            <div className="flex space-x-2 md:space-x-3">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage((e.target as HTMLTextAreaElement).value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 h-8 md:h-10 px-3 py-1 md:py-2 border-2 border-black bg-white font-bold text-black text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="h-8 md:h-10 px-3 md:px-4 border-2 border-black font-black uppercase italic text-xs hover:bg-black hover:text-white transition-colors disabled:opacity-50"
              >
                {isLoading ? "..." : "Gửi"}
              </button>
              <button
                onClick={clearConversation}
                className="h-8 md:h-10 px-3 md:px-4 border-2 border-black font-black uppercase italic text-xs hover:bg-black hover:text-white transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
