export default function AuthButton(props: {
  type?: 'button' | 'submit' | 'reset' | undefined;
  value?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type={props.type}
      className="bg-black text-white hover:bg-gray-700  focus:bg-gray-700 w-full py-2 px-4 rounded-lg"
      onClick={props.onClick}
      value={props.value}
    >
      {props.children}
    </button>
  );
}
