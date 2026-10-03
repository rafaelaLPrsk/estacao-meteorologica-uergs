import './PaginaContato.css';

function PaginaContato({ voltar }) {
    return (
        <div className="contato-wrapper">
            {/* Cartão branco principal */}
            <div className="card-contato">
                <div className="grid-contatos">

                    {/* Orientador 1 */}
                    <div className="bloco-contato">
                        <p>Profa. Dra. Leticia Vieira Guimarães - Orientadora</p>
                        {/*<p>51 9238-1202</p>*/}
                        <p>leticia-guimaraes@uergs.edu.br</p>
                    </div>

                    {/* Orientador 2 */}
                    <div className="bloco-contato">
                        <p>Prof. Dr. Celso Maciel da Costa - Orientador</p>
                        {/* <p>51 8199-3675</p> */}
                        <p>celso-costa@uergs.edu.br</p>
                    </div>

                    {/* Aluno 1 */}
                    <div className="bloco-contato">
                        <p>Luís Vitor Vaz de Mattos- aluno</p>
                        {/*<p>51 9720-6786</p>*/}
                        <p>luis-mattos@uergs.edu.br</p>
                    </div>

                    {/* Aluno 2 */}
                    <div className="bloco-contato">
                        <p>Rafaela Pokorski - aluna</p>
                        {/*<p>51 99720-2554</p>*/}
                        <p>rafaela-pokorski@uergs.edu.br</p>
                    </div>

                </div>
            </div>

            {/* Seta de Voltar embaixo */}
            <div className="container-voltar">
                <button className="botao-voltar-contato" onClick={voltar}>
                    &#8617;
                </button>
            </div>
        </div>
    );
}

export default PaginaContato;