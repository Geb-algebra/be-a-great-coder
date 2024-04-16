export default function AuthErrorMessage(props: { message?: string }) {
  if (props.message) {
    return (
      <div className="flex flex-col gap-6 px-6 py-2 border border-red-300 rounded-2xl">
        <p className="text-red-500 h-6">{props.message}</p>
      </div>
    );
  }
  return null;
}
