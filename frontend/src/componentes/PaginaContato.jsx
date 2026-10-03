import './PaginaContato.css';

const ORIENTADORES = [
    { nome: 'Profa. Dra. Leticia Vieira Guimarães', papel: 'Orientadora', email: 'leticia-guimaraes@uergs.edu.br' },
    { nome: 'Prof. Dr. Celso Maciel da Costa', papel: 'Orientador', email: 'celso-costa@uergs.edu.br' },
];

const ALUNOS = [
    { nome: 'Luís Vitor Vaz de Mattos', papel: 'Aluno', email: 'luis-mattos@uergs.edu.br' },
    {
        nome: 'Rafaela Pokorski', papel: 'Aluna', email: 'rafaela-pokorski@uergs.edu.br',
        linkedin: 'https://www.linkedin.com/in/rafaela-pokorski-370b21208/',
    },
    {
        nome: 'Manoela Terra dos Santos', papel: 'Aluna', email: 'manoela-santos@uergs.edu.br',
        linkedin: 'https://www.linkedin.com/in/manoela-terra-075574336/',
    },
];

function Pessoa({ nome, papel, email, linkedin }) {
    return (
        <li className="pessoa-contato">
            <div className="pessoa-linha">
                <span className="nome-contato">{nome}</span>
                <span className="papel-contato">{papel}</span>
            </div>
            <div className="pessoa-linha">
                <span className="email-contato">{email}</span>
                {linkedin && (
                    <a className="link-linkedin" href={linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
                )}
            </div>
        </li>
    );
}

function PaginaContato() {
    return (
        <div className="contato-wrapper">
            <div className="card-contato">
                <div className="contato-intro">
                    <h2>Contato</h2>
                    <p>
                        O Tempo UERGS é desenvolvido por alunos do curso de Engenharia de Computação da UERGS,
                        com orientação de professores da universidade.
                    </p>
                    <p>Dúvidas, sugestões ou interesse no projeto? Fale com a nossa equipe.</p>
                </div>

                <div className="contato-lista">
                    <h3 className="secao-contato">ORIENTAÇÃO</h3>
                    <ul>{ORIENTADORES.map((p) => <Pessoa key={p.email} {...p} />)}</ul>

                    <h3 className="secao-contato">ALUNOS · ENGENHARIA DE COMPUTAÇÃO</h3>
                    <ul>{ALUNOS.map((p) => <Pessoa key={p.email} {...p} />)}</ul>
                </div>
            </div>
        </div>
    );
}

export default PaginaContato;
