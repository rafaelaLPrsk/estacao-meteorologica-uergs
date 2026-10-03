import { useState } from 'react';
import './App.css';
import MenuTopo from './componentes/MenuTopo';
import PainelClima from './componentes/PainelClima';
import CardSensores from './componentes/CardSensores';
import PaginaSobre from './componentes/PaginaSobre';
import PaginaContato from './componentes/PaginaContato';


function App() {

    const [paginaAtiva, setPaginaAtiva] = useState('agora');



    return (
        <div className="tela-principal">
            {/* 1. Passamos o controle de página para o Menu */}
            <MenuTopo mudarPagina={setPaginaAtiva} paginaAtual={paginaAtiva} />

            {/* 2. Mostra o painel e os sensores apenas quando a aba for 'agora' */}
            {paginaAtiva === 'agora' && (
                <>
                    <PainelClima />
                    <CardSensores />
                </>
            )}

            {/* 3. Mostra a página 'Sobre'/contato quando a aba for selecionada */}
            {paginaAtiva === 'sobre' && (
                <PaginaSobre voltar={() => setPaginaAtiva('agora')} />
            )}

            {paginaAtiva === 'contato' && (
                <PaginaContato voltar={() => setPaginaAtiva('agora')} />
            )}


        </div>
    );

}

export default App;