import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, ClipboardList, HelpCircle } from 'lucide-react';

const exercises = [
  { id: 'memory',    icon: '🎴', name: 'Memory Match',        domain: 'Short-term memory',      desc: 'Find matching pairs of cards by remembering their positions. Tests visual memory and concentration.' },
  { id: 'pattern',   icon: '🔵', name: 'Pattern Recognition', domain: 'Sequential memory',       desc: 'Watch a colour sequence, then repeat it. Tests the ability to retain and recall ordered information.' },
  { id: 'sequence',  icon: '🔢', name: 'Sequence Recall',     domain: 'Working memory',          desc: 'Memorise a series of numbers and type them back. Tests short-term verbal memory.' },
  { id: 'word',      icon: '📝', name: 'Word Games',          domain: 'Language & categorisation',desc: 'Remember a list of words from a category, then identify them in a mixed list. Tests semantic memory.' },
  { id: 'spatial',   icon: '🧩', name: 'Spatial Puzzle',      domain: 'Spatial reasoning',       desc: 'Slide numbered tiles into the correct order. Tests spatial awareness and planning.' },
  { id: 'attention', icon: '🔍', name: 'Focus Challenge',     domain: 'Sustained attention',     desc: 'Find all instances of a target shape in a grid as quickly as possible. Tests visual attention and processing speed.' },
];

export function HelpPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="w-6 h-6 text-headway-blue" />
        <h1 className="text-2xl font-bold text-headway-navy">Help & Guide</h1>
      </div>

      <Tabs defaultValue="started">
        <TabsList className="mb-6">
          <TabsTrigger value="started">Getting started</TabsTrigger>
          <TabsTrigger value="exercises">Exercise guide</TabsTrigger>
        </TabsList>

        <TabsContent value="started">
          <div className="space-y-4">
            {[
              { step: 1, icon: Brain, title: 'Add a client', body: 'From your dashboard, click "Add client" and enter a name or reference code. No other personal data is stored.' },
              { step: 2, icon: ClipboardList, title: 'Start a session', body: 'Click "Start session" on any client card. Choose which exercises to run and set the difficulty level.' },
              { step: 3, icon: Brain, title: 'Hand over the device', body: 'The client will see a calm, full-screen view with only their name. No other client information is visible.' },
              { step: 4, icon: ClipboardList, title: 'Record your notes', body: 'After the exercises, add your observations. The AI will generate a draft summary which you can edit before saving.' },
            ].map(({ step, title, body }) => (
              <Card key={step} className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-headway-navy flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: '#6491C0' }}>
                      {step}
                    </span>
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed pl-10">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <div className="space-y-3">
            {exercises.map(ex => (
              <Card key={ex.id} className="border-0 shadow-sm">
                <CardContent className="p-5 flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0">{ex.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-headway-navy">{ex.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: '#E8F0F8', color: '#003361' }}>
                        {ex.domain}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{ex.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
