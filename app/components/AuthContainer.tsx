export default function AuthContainer(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 px-6 py-6 border border-gray-300 rounded-2xl">
      {props.children}
    </div>
  );
}
