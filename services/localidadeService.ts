// Consulta às APIs públicas ViaCEP (endereço pelo CEP) e IBGE (estados e municípios) - [Deyvidsk10]
// Usamos fetch direto do navegador, pois as duas APIs liberam CORS - [Deyvidsk10]
import { EnderecoViaCep, EstadoIBGE, MunicipioIBGE } from '../types/pizzaria';

const IBGE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

// Cache simples para não repetir a mesma consulta ao IBGE - [Deyvidsk10]
let cacheEstados: EstadoIBGE[] | null = null;
const cacheMunicipios: Record<string, MunicipioIBGE[]> = {};

export const LocalidadeService = {
    // Lista os 27 estados ordenados pelo nome - [Deyvidsk10]
    async estados(): Promise<EstadoIBGE[]> {
        if (cacheEstados) return cacheEstados;
        const resposta = await fetch(`${IBGE_URL}/estados?orderBy=nome`);
        if (!resposta.ok) throw new Error('Falha ao buscar estados no IBGE');
        cacheEstados = (await resposta.json()) as EstadoIBGE[];
        return cacheEstados;
    },

    // Lista os municípios de uma UF (ex.: "SP") - [Deyvidsk10]
    async municipios(uf: string): Promise<MunicipioIBGE[]> {
        if (cacheMunicipios[uf]) return cacheMunicipios[uf];
        const resposta = await fetch(`${IBGE_URL}/estados/${uf}/municipios?orderBy=nome`);
        if (!resposta.ok) throw new Error('Falha ao buscar municípios no IBGE');
        cacheMunicipios[uf] = (await resposta.json()) as MunicipioIBGE[];
        return cacheMunicipios[uf];
    },

    // Busca o endereço pelo CEP; devolve null se o CEP não existir - [Deyvidsk10]
    async buscarCep(cep: string): Promise<EnderecoViaCep | null> {
        const somenteNumeros = cep.replace(/\D/g, '');
        if (somenteNumeros.length !== 8) return null;
        const resposta = await fetch(`https://viacep.com.br/ws/${somenteNumeros}/json/`);
        if (!resposta.ok) throw new Error('Falha ao consultar o ViaCEP');
        const dados = (await resposta.json()) as EnderecoViaCep;
        return dados.erro ? null : dados;
    }
};
