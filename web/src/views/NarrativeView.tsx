import { narrativeArc } from '../data/loader'
import {
  SectionHead,
  TwoCol,
  Expandable,
  Cite,
  References,
  ExploreButton,
} from '../components/shared'

function extractChapterName(chapter: string): string {
  const match = chapter.match(/^(.*?)(?:\s*\(|$)/)
  return match?.[1]?.trim() ?? chapter
}

export default function NarrativeView() {
  const chapters = (narrativeArc.previousChapters ?? []).map((ch) => ({
    full: ch,
    name: extractChapterName(ch),
  }))

  const totalDots = chapters.length + 1
  const timelineEntries = [
    ...chapters.map((chapter, index) => ({
      index: index + 1,
      label: chapter.name,
      detail: chapter.full,
      current: false,
    })),
    {
      index: totalDots,
      label: narrativeArc.currentChapter,
      detail: narrativeArc.description,
      current: true,
    },
  ]

  return (
    <div className="space-y-10">
      <SectionHead
        title="Narrative Arc"
        explanation="Every life follows narrative patterns. This analysis identifies the story structure emerging from your data, the chapters you've lived through and the narrative tension currently shaping your trajectory. Based on McAdams' narrative identity theory (2001) and Campbell's monomyth."
      />

      <TwoCol
        left={
          <div className="relative pl-10">
            <div className="absolute bottom-3 left-4 top-3 w-px bg-[color:var(--line-strong)]" />
            <div className="space-y-8">
              {timelineEntries.map((chapter) => (
                <div key={`${chapter.index}-${chapter.label}`} className="relative">
                  <div
                    className={`absolute -left-10 top-1 z-[1] flex h-8 w-8 items-center justify-center rounded-full border text-[0.72rem] tabular-nums ${
                      chapter.current
                        ? 'border-[color:var(--accent)]/45 bg-[color:var(--paper-strong)] text-[color:var(--accent)] shadow-[0_0_0_4px_rgba(244,237,226,0.92)]'
                        : 'border-[color:var(--line-strong)] bg-[color:var(--paper-strong)] text-[color:var(--ink-soft)]'
                    }`}
                  >
                    {chapter.index}
                  </div>

                  <div className="pt-0.5">
                    <div
                      className={`text-[0.62rem] uppercase tracking-[0.24em] ${
                        chapter.current ? 'text-[color:var(--accent)]' : 'text-[color:var(--ink-faint)]'
                      }`}
                    >
                      {chapter.current ? 'Current chapter' : `Chapter ${String(chapter.index).padStart(2, '0')}`}
                    </div>
                    <h3
                      className={`mt-2 text-[1.45rem] leading-tight ${
                        chapter.current ? 'text-[color:var(--accent)]' : 'text-[color:var(--ink)]'
                      }`}
                    >
                      {chapter.label}
                    </h3>
                    {!chapter.current && (
                      <p className="mt-2 text-[0.84rem] leading-7 text-[color:var(--ink-faint)]">
                        {chapter.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
        right={
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-[color:var(--ink)]">
                {narrativeArc.currentChapter}
              </h3>
              <ExploreButton
                finding={narrativeArc.currentChapter}
                context={narrativeArc.description}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--ink-soft)]">
              {narrativeArc.description}
            </p>
          </div>
        }
      />

      {/* Tension */}
      <div className="border-l-2 border-[#a77c58]/35 pl-4">
        <span className="text-xs font-medium uppercase tracking-wider text-[#a77c58]">
          Tension
        </span>
        <p className="mt-1 text-sm leading-relaxed text-[color:var(--ink-soft)]">
          {narrativeArc.tensionPoint}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-[color:var(--ink-faint)]">
          Narrative tension is the unresolved force that drives the story
          forward. In identity terms, it represents the central conflict between
          where you are and where the data suggests you could be. This is not
          necessarily negative, tension is the engine of growth.
        </p>
      </div>

      {/* Possible Resolutions */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-[color:var(--ink)]">
          Possible Resolutions
        </h3>
        <div className="space-y-0">
          {(narrativeArc.possibleResolutions ?? []).map((resolution, idx) => (
            <Expandable
              key={idx}
              title={`${idx + 1}. ${resolution}`}
            >
              <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">
                This resolution path represents one way the current narrative
                tension could resolve. Its viability depends on the alignment
                between existing behavioral patterns and the structural
                conditions identified in the data. Resolutions are not
                prescriptions, they are trajectories the evidence supports.
              </p>
            </Expandable>
          ))}
        </div>
      </div>

      {/* References */}
      <References>
        <Cite
          author="Dan P. McAdams"
          work="The Redemptive Self: Stories Americans Live By"
          year="2006"
          detail="Identity as internalized, evolving life narrative"
        />
        <Cite
          author="Joseph Campbell"
          work="The Hero with a Thousand Faces"
          year="1949"
          detail="Universal monomyth structure across cultures"
        />
        <Cite
          author="Jerome Bruner"
          work="Actual Minds, Possible Worlds"
          year="1986"
          detail="Narrative as a fundamental mode of thought"
        />
      </References>
    </div>
  )
}
