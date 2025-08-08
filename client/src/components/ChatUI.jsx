import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function ChatUI() {
    const [input, setInput] = useState(""); 
    const [messages, setMessages] = useState([]); // Listen for messages from server useEffect(() => { socket.on("message", (msg) => { setMessages((prev) => [...prev, { type: "server", text: msg }]); });
    useEffect(()=>{
        socket.on("message", (msg) => {
            setMessages((prev) => [...prev, {
                type: "server",
                text: msg
            }])
        })
    return () => {
      socket.off("message");
    };
    }, []); 
   const sendIOMessage = () => { 
    if (input.trim()) { socket.emit("message", input); 
        setMessages((prev) => [...prev, { type: "user", text: input }]); 
        setInput(""); 
    } 
};
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 3000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('session', (data) => {
      console.log('Received sessionId:', data.sessionId);
      setSessionId(data.sessionId);
    });

    newSocket.on('message', (data) => {
      if (data.message) {
        setMessages((prev) => [...prev, { text: data.message, from: 'server' }]);
      }
    });

    // newSocket.on('disconnect', () => {
    //   console.log('WebSocket disconnected');
    //   setIsConnected(false);
    //   setSessionId(null);
    // });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    return () => {
    //   newSocket.disconnect();
      console.log('WebSocket connection closed');
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim() || !sessionId || !isConnected || !socket) {
      console.error('Cannot send message: No sessionId, not connected, or no socket');
      return;
    }

    socket.emit('message', { message: input });
    setMessages((prev) => [...prev, { text: input, from: 'user' }]);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Chatbot</h1>
      <div className="mb-4 text-sm text-gray-600">
        {isConnected ? `Connected (Session ID: ${sessionId || 'Waiting...'})` : 'Connecting...'}
      </div>
      <div className="h-64 overflow-y-auto border rounded p-4 mb-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded ${
              msg.from === 'user' ? 'bg-blue-100 ml-auto max-w-xs' : 'bg-gray-200 mr-auto max-w-xs'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          disabled={!isConnected || !sessionId}
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 disabled:bg-gray-400"
          disabled={!isConnected || !sessionId}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatUI;