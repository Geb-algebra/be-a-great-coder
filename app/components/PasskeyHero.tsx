function QandA(props: { question: string; answer: string }) {
  return (
    <li className="my-2">
      <h3 className="font-bold">{props.question}</h3>
      <p>{props.answer}</p>
    </li>
  );
}

export default function PasskeyHero(props: { className?: string }) {
  return (
    <ul className={`bg-gray-300 rounded-lg px-4 py-2 ${props.className ?? ""}`}>
      <QandA
        question="Why should I use passkeys?"
        answer="With passkeys, you don’t need to remember complex passwords."
      />
      <QandA
        question="What are passkeys?"
        answer="Passkeys are encrypted digital keys you create using your fingerprint, face, or screen lock."
      />
      <QandA
        question="Where are passkeys saved?"
        answer="Passkeys are saved in your password manager, so you can sign in on other devices."
      />
    </ul>
  );
}
