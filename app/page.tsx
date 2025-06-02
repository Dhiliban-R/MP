export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        FDMS - Food Donation Management System
      </h1>
      <p className="text-center text-lg mb-8">
        Welcome to the Food Donation Management System
      </p>
      <div className="text-center">
        <a href="/auth/login" className="bg-blue-500 text-white px-6 py-3 rounded mr-4">
          Login
        </a>
        <a href="/auth/register" className="bg-green-500 text-white px-6 py-3 rounded">
          Register
        </a>
      </div>
    </div>
  );
}
