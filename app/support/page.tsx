'use client';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Support</h1>
        <p className="mt-4 text-gray-300">
          Need help with your subscription or have a question? Reach out and we’ll assist you.
        </p>
        <div className="mt-8 space-y-4 text-gray-200">
          <p>Email: <a className="text-blue-400 hover:text-blue-300" href="mailto:support@rydenofficial.com">support@rydenofficial.com</a></p>
          <p>Phone: <a className="text-blue-400 hover:text-blue-300" href="tel:+911234567890">+91 12345 67890</a></p>
          <p>Hours: Monday–Friday, 9:00–18:00 IST</p>
        </div>
      </div>
    </div>
  );
}

