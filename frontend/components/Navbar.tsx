import { ModeToggle } from "./mode-toggle";
import { Input } from "./ui/input";

export default function Navbar() {
    return (
        <nav className="w-full flex items-center justify-between p-4">
            
            <p className="font-bold text-brand-red text-xl md:text-3xl">Mariana</p>
            <Input placeholder="Search" className="max-w-2xl border-0 bg-primary focus:ring-primary" />
            <ModeToggle />
        </nav>
    )
}
