const baseUrl = 'https://pokeapi.co/api/v2'
let pokemonList = []
let nextUrl = ''

async function fetchPokemons(url) {
    try {
        const loadMoreElement = document.querySelector('.load-more-section')
        loadMoreElement.style.display = "None"
        if (url == '') {
            url = `${baseUrl}/pokemon?limit=50&offset=0`
        }
        const res = await fetch(url);
        loadMoreElement.style.display = ''
        if (!res.ok) {
            throw new Error(`Failed to fetch pokemons: ${res.status}`)
        }
        return await res.json()
    } catch(e) {
        console.log(e);
    }
}

async function fetchPokemonByName(name) {
    try {
        // console.log(`Fetching results for ${name}`)
        const res = await fetch(`${baseUrl}/pokemon/${name}`);;
        if (!res.ok) {
            throw new Error(`Failed to fetch pokemon: ${res.status}`)
        }
        return await res.json()
    } catch(e) {
        console.log(e);
    }
}

async function displayPokemonCards(url='') {
    const resultsGridElement = document.querySelector('.results-grid');
    fetchPokemons(url).then(
        pokemons => {
            if (!pokemons) {
                resultsGridElement.innerHTML = 'No pokemons fetched.';
                return;
            }
            nextUrl = pokemons['next'];
            return pokemons['results']
        }
    ).then(
        async pokemons => {
            for (const pokemon of pokemons) {
                pokemonData = await fetchPokemonByName(pokemon['name'])
                if (!pokemonData) {
                    return;
                }
                if (!pokemonList.some( x => x.name == pokemon['name'])) {
                    pokemonList.push(
                        {
                            'id': pokemonData['id'],
                            'height': pokemonData['height'], 
                            'weight': pokemonData['weight'], 
                            'species': pokemonData['species'], 
                            'sprites': pokemonData['sprites'], 
                            'stats': pokemonData['stats'], 
                            'types': pokemonData['types'], 
                            'name': pokemonData['name'],
                        }
                    )
                }
                const childCard = createCard(pokemonData);
                resultsGridElement.appendChild(childCard);
            }
        }
    ).catch(
        e => {
            console.log(e)
        }
    )
}

function createCard(data) {
    const pokemonCardElement = document.createElement('div');
    pokemonCardElement.setAttribute('class', 'pokemon-card');
    

    const pokemonImageElement = document.createElement('img');
    let image = data['sprites']['versions']['generation-v']['black-white']['animated']['front_default']
    if (!image) {
        image = data['sprites']['front_default']
    }
    pokemonImageElement.setAttribute('src', image);
    pokemonCardElement.appendChild(pokemonImageElement);

    const pokemonPodiumElement = document.createElement('div');
    pokemonPodiumElement.setAttribute('class', 'podium');
    pokemonCardElement.appendChild(pokemonPodiumElement);

    const pokemonCardContentElement = document.createElement('div');
    pokemonCardContentElement.setAttribute('class', 'card-content');

    const pokemonIdElement = document.createElement('h3');
    pokemonIdElement.innerHTML = '#' + ('00' + data['id']).slice(-3);
    pokemonCardContentElement.appendChild(pokemonIdElement);

    const pokemonNameElement = document.createElement('h2');
    pokemonNameElement.innerHTML = data['name'];
    pokemonNameElement.setAttribute('onclick', `openPreview('${data['name']}')`);
    pokemonCardContentElement.appendChild(pokemonNameElement);

    const pokemonTypeContainerElement = document.createElement('div');
    pokemonTypeContainerElement.setAttribute('class', 'type');

    data['types'].forEach(
        typeObj => {
            const typeName = typeObj.type.name;
            const pokemonTypeElement = document.createElement('h4');
            pokemonTypeElement.innerHTML = typeName
            pokemonTypeElement.setAttribute('class', `${typeName}-type`);
            pokemonTypeContainerElement.appendChild(pokemonTypeElement);
        }
    )

    

    pokemonCardContentElement.appendChild(pokemonTypeContainerElement);
    pokemonCardElement.appendChild(pokemonCardContentElement);
    return pokemonCardElement;
}

displayPokemonCards()

async function searchPokemon() {
    const resultsGridElement = document.querySelector('.results-grid');

    const searchInputElement = document.querySelector('.search-bar input');
    const searchStr = searchInputElement.value.toLowerCase()

    const loadMoreElement = document.querySelector('.load-more-section')

    if (!searchStr) {

        resultsGridElement.replaceChildren();
        pokemonList.forEach(
            pokemon => {
                resultsGridElement.appendChild(createCard(pokemon))
            }
        )
        loadMoreElement.style.display = ''
        return;
    }

    console.log(`searching for ${searchStr}`)
    console.log('list', pokemonList)

    idx = pokemonList.findIndex((pokemon) => pokemon.name == searchStr)
    if (idx >= 0) {
        resultsGridElement.replaceChildren(createCard(pokemonList[idx]));
        return
    }

    idx = pokemonList.findIndex((pokemon) => pokemon.id == searchStr)
    if (idx >= 0) {
        resultsGridElement.replaceChildren(createCard(pokemonList[idx]));
        return
    }

    resultsGridElement.replaceChildren();

    pokemonList.forEach(
        pokemon => {
            if (pokemon.name.toLowerCase().includes(searchStr)) {
                resultsGridElement.appendChild(createCard(pokemon));
            }
        }
    )

    if (!resultsGridElement.hasChildNodes()) {
        pokemonData = await fetchPokemonByName(searchStr)
        if (pokemonData) {
            const childCard = createCard(pokemonData);
            resultsGridElement.appendChild(childCard);
            loadMoreElement.style.display = "None"
        }
    }

    if (!resultsGridElement.hasChildNodes()) {
        const noResultElement = document.createElement('h4');
        noResultElement.innerHTML = 'No Results Found.'
        resultsGridElement.appendChild(noResultElement)
        loadMoreElement.style.display = "None"
    }

}


const loadMoreButtonElement = document.querySelector('.load-more-button');
loadMoreButtonElement.addEventListener("click", loadMore);

async function loadMore() {
    displayPokemonCards(nextUrl)
}

function toggleFilterSection() {
    const filterSectionElement = document.querySelector('.filter-section');
    const className = filterSectionElement.getAttribute('class');
    if (className.includes('hidden')) {
        filterSectionElement.classList.remove("hidden");
    }
    else {
        filterSectionElement.classList.add("hidden");
    }
    
}

function filterResults(type) {

    const loadMoreElement = document.querySelector('.load-more-section');
    const filterSectionElement = document.querySelector('.filter-section');
    const typeElements = document.querySelectorAll('.type-item');
    typeElements.forEach(
        typeElement => {
            if (typeElement.textContent == type) {
                typeElement.classList.add('active')
            } else {
                typeElement.classList.remove('active')
            }
        }
    )
    
    if (type == 'all') {
        const filteredPokemonCardElements = document.querySelectorAll('.pokemon-card.hidden');
        filteredPokemonCardElements.forEach(
            hiddenPokemonCard => {
                hiddenPokemonCard.classList.remove("hidden")
            }
        )
        loadMoreElement.style.display = ''
        filterSectionElement.classList.add("hidden");
        return
    }

    const allPokemonCardElements = document.querySelectorAll('.pokemon-card');
    allPokemonCardElements.forEach(
        hiddenPokemonCard => {
            hiddenPokemonCard.classList.add("hidden")
        }
    )

    const filteredPokemonCardElements = document.querySelectorAll(`.${type}-type`);
    if (filteredPokemonCardElements.length > 0) {
        console.log(filteredPokemonCardElements[0].closest('.pokemon-card'))
        filteredPokemonCardElements.forEach(
            hiddenPokemonCard => {
                hiddenPokemonCard.closest('.pokemon-card').classList.remove("hidden")
            }
        )
    }

    loadMoreElement.style.display = "None"
    filterSectionElement.classList.add("hidden");

}

function openPreview(name) {
    const previewSectionElement = document.querySelector('.preview-section');

    idx = pokemonList.findIndex((pokemon) => pokemon.name == name)

    const previewImageElement = document.querySelector('.preview-image img');
    let image = pokemonList[idx]['sprites']['versions']['generation-v']['black-white']['animated']['front_default']
    if (!image) {
        image = pokemonList[idx]['sprites']['front_default']
    }
    previewImageElement.setAttribute('src', image);

    const previewIdElement = document.querySelector('.preview-id');
    previewIdElement.innerHTML = '#' + ('00' + pokemonList[idx]['id']).slice(-3)

    const previewNameElement = document.querySelector('.preview-name');
    previewNameElement.innerHTML = pokemonList[idx]['name']

    const previewHeightElement = document.querySelector('.preview-vitals-value.height');
    previewHeightElement.innerHTML = pokemonList[idx]['height'] / 10 + ' m'
    
    const previewWeightElement = document.querySelector('.preview-vitals-value.weight');
    previewWeightElement.innerHTML = pokemonList[idx]['weight'] / 10 + ' kg'

    const previewHpStatElement = document.querySelector('.preview-stat-value.hp');
    previewHpStatElement.innerHTML = pokemonList[idx]['stats'][0]['base_stat']
    
    const previewAttackStatElement = document.querySelector('.preview-stat-value.attack');
    previewAttackStatElement.innerHTML = pokemonList[idx]['stats'][1]['base_stat']

    const previewDefenseStatElement = document.querySelector('.preview-stat-value.defense');
    previewDefenseStatElement.innerHTML = pokemonList[idx]['stats'][2]['base_stat']

    const previewSAttackStatElement = document.querySelector('.preview-stat-value.s-attack');
    previewSAttackStatElement.innerHTML = pokemonList[idx]['stats'][3]['base_stat']

    const previewSDefenseStatElement = document.querySelector('.preview-stat-value.s-defense');
    previewSDefenseStatElement.innerHTML = pokemonList[idx]['stats'][4]['base_stat']

    const previewSpeedStatElement = document.querySelector('.preview-stat-value.speed');
    previewSpeedStatElement.innerHTML = pokemonList[idx]['stats'][5]['base_stat']

    previewSectionElement.classList.remove("hidden")

}

function closePreview() {
    const previewSectionElement = document.querySelector('.preview-section');
    previewSectionElement.classList.add("hidden")
}

function goToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}