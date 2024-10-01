"use client";
import React, { useState } from "react";

export default function HomeContent() {
  const [message, setMessage] = useState("");

  const handleAction = async (action) => {
    setMessage("Processing...");
    try {
      const response = await fetch(`/api/worker?action=${action}`, {
        method: "POST",
      });
      const data = await response.json();
      console.log(data);
      setMessage(data.message);
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full h-full ">
      <h1 className="text-4xl text-center font-bold pb-36">
        Welcome to Sync r2 To db
      </h1>
      <div className="w-2/3 mx-auto pb-32">
        <section className="flex flex-row justify-around items-center gap-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
            onClick={() => handleAction("syncR2ToDB")}
          >
            Sync R2 Bucket to DB
          </button>

          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
            onClick={() => handleAction("resetR2")}
          >
            Reset R2 Bucket
          </button>

          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mb-4"
            onClick={() => handleAction("resetD1")}
          >
            Reset D1 Database Table Data
          </button>
        </section>
      </div>

      <div className="w-2/3 mx-auto">
        {message && (
          <div className="mt-4 p-2 bg-gray-100 rounded">{message}</div>
        )}
      </div>
    </div>
  );
}
