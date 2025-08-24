"use client";
import React from "react";
import { AuthGuard } from "@/components/auth-guard";
import DynastyAssistant from "@/components/dynasty-assistant";

export default function AssistantPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Dynasty Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              AI-powered fantasy football advice using your dynasty values data
            </p>
          </div>
          <DynastyAssistant />
        </div>
      </div>
    </AuthGuard>
  );
}
