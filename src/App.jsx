import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { model, objectById, objectPath, relationsFor } from './model.js';
import ModelDiagram from './components/ModelDiagram.jsx';
import Icon from './components/Icon.jsx';

function Search({ value, onChange, label = 'Otsi objekti', placeholder = 'Otsi nime või ingliskeelse termini järgi…' }) {
  return <div className="search"><Icon name="search" size={18}/><input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}/></div>;
}
function Header({ onMenu, menuOpen }) {
  return <header className="site-header"><div className="site-header__inner">
    <Link to="/" className="brand">Colectica metainfomudel</Link>
    <nav aria-label="Peamenüü"><NavLink to="/" end>Alusmudel</NavLink><NavLink to="/objektid">Objektid <span className="nav-count">{model.objects.length}</span></NavLink></nav>
    <button className="icon-button mobile-menu" aria-label="Objektide menüü" aria-expanded={menuOpen} onClick={onMenu}><Icon name={menuOpen ? 'close' : 'menu'}/></button>
  </div></header>;
}
function Sidebar({ open, close }) {
  const [query, setQuery] = useState('');
  return <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Mudeli objektid">
    <Link to="/" className="sidebar__home" onClick={close}><Icon name="model" size={18}/>Alusmudeli ülevaade<Icon name="arrow" size={16}/></Link>
    <div className="sidebar__heading">MUDELI KIRJED <span>{model.objects.length}</span></div>
    <Search value={query} onChange={setQuery} placeholder="Otsi objekti…" label="Otsi menüüst objekti"/>
    {model.groups.map((group) => {
      const items = model.objects.filter((o) => o.group === group.id && `${o.name} ${o.nameEn}`.toLocaleLowerCase('et').includes(query.toLocaleLowerCase('et')));
      return items.length > 0 && <div className="sidebar__group" key={group.id}><div className="group-caption"><span style={{ background: group.color }}/>{group.name}</div>{items.map((o) => <NavLink key={o.id} to={objectPath(o.id)} onClick={close}>{o.name}<span>{o.nameEn}</span></NavLink>)}</div>;
    })}
    {query && !model.objects.some((o) => `${o.name} ${o.nameEn}`.toLocaleLowerCase('et').includes(query.toLocaleLowerCase('et'))) && <p className="empty">Objekti ei leitud.</p>}
  </aside>;
}
function Legend() { return <div className="legend">{model.groups.map((g) => <span key={g.id}><i style={{ background: g.color }}/>{g.name}</span>)}</div>; }
function Home() {
  return <>
    <div className="eyebrow">STATISTIKAAMET · MUDELI ÜLEVAADE</div>
    <div className="page-heading"><h1>Colectica metainfomudel</h1></div>
    <p className="intro">Metainfomudelit saab uurida lähemalt, klikkides objektidele.</p>
    <div className="model-meta"><Legend/></div>
    <ModelDiagram/>
    <div className="below-diagram"><Link to="/objektid">Kõik kirjed <Icon name="arrow" size={16}/></Link></div>
    <section className="home-note"><span className="section-number">01 / ALUSMUDEL</span><div><h2>Tervikust üksikasjadeni</h2><p>Objekti lehel näed selle seoseid teiste objektidega. Liigu mudelis mööda seoseid või vali objekt vasakust menüüst.</p></div></section>
  </>;
}
function ObjectPage() {
  const { id } = useParams();
  const item = objectById[id];
  if (!item) return <NotFound/>;
  const relations = relationsFor(id);
  return <>
    <Link to="/" className="breadcrumb"><Icon name="back" size={16}/>Alusmudel</Link>
    <h1>{item.name}</h1>
    <p className="english-title">{item.nameEn}</p>
    <section className="content-section" id="seosed">
      <h2>Seosed</h2>
      <ModelDiagram key={id} focusId={id}/>
      <div className="table-scroll" style={{ marginTop: 20 }}>
        <table className="relations-table">
          <thead><tr><th>Lähtekirje</th><th>Seos</th><th>Sihtkirje</th></tr></thead>
          <tbody>{relations.map((r) => <tr key={r.id}>
            <td><Link to={objectPath(r.source)}>{objectById[r.source].name}</Link></td>
            <td>{r.label}</td>
            <td><Link to={objectPath(r.target)}>{objectById[r.target].name}</Link></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
    <section className="content-section" id="atribuudid"><h2>Atribuudid</h2></section>
  </>;
}
function Directory() {
  const [query, setQuery] = useState('');
  const items = model.objects.filter((o) => `${o.name} ${o.nameEn}`.toLocaleLowerCase('et').includes(query.toLocaleLowerCase('et')));
  return <><div className="eyebrow">MUDELI SIRVIMINE</div><div className="page-heading"><h1>Objektid ja kirjeldusosad</h1></div><p className="intro">Alusmudelis kasutatud kirjed, nende tähendused ja omavahelised seosed.</p><div className="directory-search"><Search value={query} onChange={setQuery}/><span role="status">{items.length} tulemust</span></div>{model.groups.map((g) => { const grouped = items.filter((o) => o.group === g.id); return grouped.length > 0 && <section className="directory-group" key={g.id}><h2><i style={{ background: g.color }}/>{g.name}</h2><div className="object-grid">{grouped.map((o) => <Link className="object-card" to={objectPath(o.id)} key={o.id} style={{ '--group-color': g.color }}><span className="object-card__en">{o.nameEn}</span><h3>{o.name}</h3><p>{o.description}</p><span className="object-card__footer">{o.kind === 'description' ? 'Kirjeldusosa' : 'Objekti kirjeldus'}<Icon name="arrow" size={18}/></span></Link>)}</div></section>; })}{items.length === 0 && <div className="empty-state">Ühtegi sobivat kirjet ei leitud. Proovi teist otsingusõna.</div>}</>;
}
function NotFound() { return <div className="not-found"><div className="eyebrow">404 / KIRJET EI LEITUD</div><h1>Seda lehte mudelis ei ole.</h1><p>Link võib olla aegunud või objekt ei kuulu veel sellesse versiooni.</p><Link to="/" className="primary-link">Alusmudeli juurde <Icon name="arrow" size={18}/></Link></div>; }
export default function App() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef(null);
  const firstRoute = useRef(true);
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
    const id = location.pathname.startsWith('/objekt/') ? location.pathname.split('/')[2] : null;
    document.title = `${objectById[id]?.name || (location.pathname === '/objektid' ? 'Objektid' : 'Alusmudel')} | Colectica metainfomudel`;
    if (!firstRoute.current) mainRef.current?.focus({ preventScroll: true });
    firstRoute.current = false;
  }, [location.pathname]);
  return <><a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Liigu sisu juurde</a><Header onMenu={() => setMenuOpen(!menuOpen)} menuOpen={menuOpen}/><div className="shell"><Sidebar open={menuOpen} close={() => setMenuOpen(false)}/>{menuOpen && <button className="menu-scrim" aria-label="Sulge objektide menüü" onClick={() => setMenuOpen(false)}/>}<div className="main-column"><main id="main" ref={mainRef} tabIndex={-1}><Routes><Route path="/" element={<Home/>}/><Route path="/objekt/:id" element={<ObjectPage/>}/><Route path="/objektid" element={<Directory/>}/><Route path="*" element={<NotFound/>}/></Routes></main><footer className="site-footer"><Link to="/">Colectica metainfomudel</Link><span>Alusmudeli demo · v{model.version}</span></footer></div></div></>;
}
