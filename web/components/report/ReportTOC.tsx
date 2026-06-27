export default function ReportTOC({ sections }: { sections: string[] }) {
  return (
    <section className="report-section toc-section">
      <h2 className="section-title">Table of Contents</h2>
      <ol className="toc-list">
        {sections.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </section>
  );
}
