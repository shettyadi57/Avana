import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Play, 
  Shield, 
  Scale, 
  Heart, 
  ArrowRight,
  Star,
  Clock,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function LearningPage() {
  const categories = [
    { name: 'Self Defense', icon: Shield, color: 'bg-purple-600' },
    { name: 'Legal Rights', icon: Scale, color: 'bg-blue-600' },
    { name: 'Mental Health', icon: Heart, color: 'bg-red-600' },
    { name: 'Safety Tips', icon: BookOpen, color: 'bg-green-600' },
  ];

  const lessons = [
    {
      title: 'Basic Self-Defense Moves',
      category: 'Self Defense',
      duration: '15 mins',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1552072805-2a9039d00e57?auto=format&fit=crop&q=80&w=400',
      isNew: true
    },
    {
      title: 'Understanding Harassment Laws',
      category: 'Legal Rights',
      duration: '20 mins',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400',
      isNew: false
    },
    {
      title: 'Digital Safety & Privacy',
      category: 'Safety Tips',
      duration: '10 mins',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400',
      isNew: false
    },
    {
      title: 'Emergency Response Training',
      category: 'Safety Tips',
      duration: '25 mins',
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&q=80&w=400',
      isNew: true
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-12">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-bold text-white mb-4">Learning Hub</h1>
          <p className="text-slate-400 text-lg mb-8">
            Empower yourself with knowledge. Learn self-defense, understand your legal rights, and stay prepared for any situation.
          </p>
          <div className="flex items-center gap-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2">
              Start Learning
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  U{i}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                +2k
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium ml-2">Students active now</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-600/10 to-transparent hidden lg:block" />
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat, i) => (
          <motion.button
            key={i}
            whileHover={{ y: -5 }}
            className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col items-center gap-4 hover:border-purple-500/50 transition-all"
          >
            <div className={cn("p-4 rounded-2xl", cat.color)}>
              <cat.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold">{cat.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Featured Lessons */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Featured Lessons</h2>
          <button className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {lessons.map((lesson, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden group cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={lesson.image} 
                  alt={lesson.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                </div>
                {lesson.isNew && (
                  <span className="absolute top-4 left-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                    New
                  </span>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>{lesson.category}</span>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-3 h-3 fill-current" />
                    {lesson.rating}
                  </div>
                </div>
                <h3 className="text-white font-bold leading-tight group-hover:text-purple-400 transition-colors">
                  {lesson.title}
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lesson.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Play className="w-4 h-4" />
                    Video
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Simulation Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2.5rem] p-8 sm:p-12 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <h2 className="text-3xl font-bold text-white">Interactive Simulations</h2>
          <p className="text-white/80 text-lg">
            Test your safety knowledge in real-world scenarios. Our AI-driven simulations help you practice quick thinking and decision making.
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-2xl font-bold hover:bg-slate-100 transition-all">
            Try Simulation
          </button>
        </div>
        <div className="w-full lg:w-1/3 aspect-video bg-black/20 rounded-3xl border border-white/20 flex items-center justify-center">
          <Play className="w-12 h-12 text-white" />
        </div>
      </div>
    </div>
  );
}
