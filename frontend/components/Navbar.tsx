import { ModeToggle } from "./mode-toggle";

export default function Navbar() {
    return (
        <nav className="w-full flex items-center justify-between p-4">
            <p className="font-bold text-primary text-xl md:text-3xl">Mariana</p>
            <ModeToggle />
        </nav>
    )
}
