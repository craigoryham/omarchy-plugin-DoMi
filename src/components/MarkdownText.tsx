import { Fragment, type ReactNode } from 'react'

type InlineNode = { t: 'text' | 'bold' | 'italic' | 'code' | 'link'; v: string; href?: string }

function parseInline(src: string): InlineNode[] {
  const out: InlineNode[] = []
  const scan = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = scan.exec(src)) !== null) {
    if (m.index > last) out.push({ t: 'text', v: src.slice(last, m.index) })
    const tok = m[0]
    if (tok.startsWith('**')) out.push({ t: 'bold', v: tok.slice(2, -2) })
    else if (tok.startsWith('`')) out.push({ t: 'code', v: tok.slice(1, -1) })
    else if (tok.startsWith('*')) out.push({ t: 'italic', v: tok.slice(1, -1) })
    else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok)
      if (linkMatch) out.push({ t: 'link', v: linkMatch[1], href: linkMatch[2] })
      else out.push({ t: 'text', v: tok })
    }
    last = m.index + tok.length
  }
  if (last < src.length) out.push({ t: 'text', v: src.slice(last) })
  return out
}

function renderInlineNodes(nodes: InlineNode[], key: number): ReactNode {
  return (
    <Fragment key={key}>
      {nodes.map((n, i) => {
        if (n.t === 'bold') return <strong key={i}>{n.v}</strong>
        if (n.t === 'italic') return <em key={i}>{n.v}</em>
        if (n.t === 'code') return (
          <code key={i} className="px-1 py-0.5 rounded bg-surface-alt border border-border-light text-[0.9em]">{n.v}</code>
        )
        if (n.t === 'link') return (
          <a key={i} href={n.href} target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary-dark">{n.v}</a>
        )
        return n.v
      })}
    </Fragment>
  )
}


function renderBlockLine(line: string, isList: boolean, listIndex: number): ReactNode {
  const trimmed = line.trim()
  const atx = /^(#{1,6})\s+(.*)$/.exec(trimmed)
  if (atx) {
    const level = atx[1].length
    const text = renderInlineNodes(parseInline(atx[2]), listIndex)
    if (level === 1) return <h1 key={listIndex} className="text-xl font-bold mt-4 mb-2">{text}</h1>
    if (level === 2) return <h2 key={listIndex} className="text-lg font-bold mt-3 mb-2">{text}</h2>
    return <h3 key={listIndex} className="text-base font-bold mt-3 mb-1">{text}</h3>
  }
  if (/^>\s?/.test(trimmed)) {
    return (
      <blockquote key={listIndex} className="border-l-2 border-primary/40 pl-3 my-2 text-text-secondary italic">
        {renderInlineNodes(parseInline(trimmed.replace(/^>\s?/, '')), listIndex)}
      </blockquote>
    )
  }
  if (/^-{3,}$/.test(trimmed)) {
    return <hr key={listIndex} className="my-3 border-border" />
  }
  if (/^```/.test(trimmed)) return null
  if (isList) {
    const content = trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '')
    return (
      <div key={listIndex} className="flex gap-2">
        <span className="text-text-muted flex-shrink-0 select-none">{listIndex % 2 === 0 ? '•' : '•'}</span>
        <span>{renderInlineNodes(parseInline(content), listIndex)}</span>
      </div>
    )
  }
  if (!trimmed) return <div key={listIndex} className="h-2" />
  return <p key={listIndex}>{renderInlineNodes(parseInline(trimmed), listIndex)}</p>
}

function mdFences(src: string): string[] {
  const parts: string[] = []
  const fenceRe = /^```(\w*)[\s\S]*?^```\s*$/gm
  let last = 0
  let m: RegExpExecArray | null
  while ((m = fenceRe.exec(src)) !== null) {
    if (m.index > last) parts.push(src.slice(last, m.index))
    const body = m[0].replace(/^```\w*\s*\n?/, '').replace(/\n?```\s*$/, '')
    parts.push(`\u0000FENCE\u0000` + body)
    last = m.index + m[0].length
  }
  if (last < src.length) parts.push(src.slice(last))
  return parts
}

export function MarkdownText({ body }: { body: string }) {
  let out: ReactNode[] = []
  let fenceEl = 0
  for (const part of mdFences(body)) {
    if (part.startsWith('\u0000FENCE\u0000')) {
      const code = part.slice(9)
      out.push(
        <pre key={`f${fenceEl++}`} className="my-2 p-3 rounded-lg bg-surface-alt border border-border-light overflow-x-auto text-[0.9em]">
          <code>{code}</code>
        </pre>
      )
      continue
    }
    const lines = part.split('\n')
    let para: string[] = []
    let list: string[] = []
    const flushPara = () => {
      if (para.length) {
        out.push(<p key={`p${fenceEl++}`}>{renderInlineNodes(parseInline(para.join(' ')), fenceEl)}</p>)
        para = []
      }
    }
    const flushList = () => {
      if (list.length) {
        out.push(
          <div key={`l${fenceEl++}`} className="my-1 space-y-0.5">
            {list.map((l, i) => renderBlockLine(l, true, i))}
          </div>
        )
        list = []
      }
    }
    for (const raw of lines) {
      const line = raw.replace(/\r$/, '')
      if (/^```/.test(line.trim())) {
        flushPara()
        flushList()
        continue
      }
      const listMatch = /^(\s*[-*+]\s+|\s*\d+\.\s+)/.exec(line)
      if (listMatch) {
        flushPara()
        list.push(line)
        continue
      }
      if (list.length) flushList()
      if (/^#{1,6}\s|^>\s?|-{3,}$|^\s*$/.test(line)) {
        flushPara()
        flushList()
        if (line.trim()) out.push(renderBlockLine(line, false, fenceEl++))
        continue
      }
      para.push(line)
    }
    flushPara()
    flushList()
  }
  return <div className="space-y-1.5 break-words">{out}</div>
}