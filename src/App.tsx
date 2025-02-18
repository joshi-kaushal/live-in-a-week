"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Confetti from "react-confetti"
import { Heart } from "lucide-react"
import { Textarea } from "./components/ui/textarea"
import { Button } from "./components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog"

// Letters data
const letters = [
  {
    id: "letter1",
    content: "My dearest Shubhudii, you make every moment beautiful. I cherish you with all my heart...",
  },
  {
    id: "letter2",
    content: "Every day with you is a new adventure, filled with love and laughter...",
  },
  {
    id: "letter3",
    content: "There is no one else in the world I'd rather spend my days with than you...",
  },
  {
    id: "letter4",
    content: "You are my soulmate, my best friend, and the love of my life...",
  },
  {
    id: "letter5",
    content: "Shubhudii, thank you for making my life so beautiful. I love you more than words can say...",
  },
]

const questions = [
  "How are you feeling right now?",
  "If you could switch lives with me for a day, what would you do?",
  "What's your favorite memory of us together?",
  "And last but never the least, would you love me if I was a worm?",
]

export default function BirthdayPage() {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(true)

  // Floating hearts
  const hearts = Array.from({ length: 20 }).map((_, i) => (
    <motion.div
      key={i}
      className="absolute text-pink-400"
      initial={{ y: "100vh", x: Math.random() * window.innerWidth }}
      animate={{
        y: -100,
        x: Math.random() * window.innerWidth,
        rotate: 360,
      }}
      transition={{
        duration: Math.random() * 20 + 10,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
    >
      <Heart size={Math.random() * 20 + 10} />
    </motion.div>
  ))

  return (
    <div className="min-h-screen bg-[#F9E2DC] text-[#4A3C31] relative overflow-hidden">
      {showConfetti && (
        <Confetti numberOfPieces={200} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />
      )}

      {hearts}

      <motion.h1
        className="text-[#D0326D] text-5xl md:text-6xl font-bold pt-12 text-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        Happy Birthday, Shubhudiiii 🥰🥰🍰
      </motion.h1>

      <div className="flex flex-wrap justify-center gap-4 px-4 mt-8">
        {letters.map((letter, index) => (
          <motion.div
            key={letter.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            <motion.img
              src={`/assets/${letter.id}.jpeg`}
              alt={`Picture ${index + 1}`}
              className="w-[200px] h-[200px] rounded-lg border-4 border-yellow-400 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedLetter(letter.id)}
            />
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedLetter} onOpenChange={() => setSelectedLetter(null)}>
        <DialogContent className="bg-[#F8D7DA] border-none">
          <DialogHeader>
            <DialogTitle className="text-[#D0326D]">My Letter to You</DialogTitle>
          </DialogHeader>
          <p className="text-lg text-[#4A3C31] py-4">{letters.find((l) => l.id === selectedLetter)?.content}</p>
        </DialogContent>
      </Dialog>

      <motion.div
        className="max-w-2xl mx-auto mt-12 p-6 bg-[#F8D7DA] rounded-lg shadow-lg"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-[#D0326D] mb-6">Let's have some fun, shall we?</h2>
        {questions.map((question, index) => (
          <div key={index} className="mb-6">
            <p className="mb-2 font-medium">
              {index + 1}. {question}
            </p>
            <Textarea placeholder="Your answer here..." className="w-full p-2 border-[#D0326D] border-2 rounded-md" />
          </div>
        ))}
        <Button
          className="bg-[#D0326D] hover:bg-[#D0326D]/90 text-white"
          onClick={() => alert("Thank you for your answers! 💕")}
        >
          Submit Your Answers
        </Button>
      </motion.div>

      <motion.div
        className="max-w-2xl p-6 mx-auto mt-12 mb-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p className="mb-4 text-lg">
          This was my small attempt to make you smile. Hope I succeeded. Cheers to a lifetime of such moments together.
          I love you a lot. May you get everything that you want. Signing off!!
        </p>
        <p className="text-xl font-semibold text-[#D0326D]">From your Gabbudi, Apurva</p>
      </motion.div>
    </div>
  )
}

