const CATEGORIES = ["love","action","horror","animation","heist","adventure"];
const CATEGORY_LABELS = {
	love: "Love",
	action: "Action",
	horror: "Horror",
	animation: "Animation",
	heist: "Heist",
	adventure: "Adventure"
};

const STORAGE_KEY = 'movieCinemaData_v1';
let data = {};
let editContext = null; // {category, index} or null

async function loadInitialData(){
	// try load from localStorage
	const saved = localStorage.getItem(STORAGE_KEY);
	if(saved){
		data = JSON.parse(saved);
		return;
	}

	// try fetch data.json
	try{
		const resp = await fetch('data.json');
		if(resp.ok){
			data = await resp.json();
			saveData();
			return;
		}
	}catch(e){console.warn('Could not fetch data.json, using built-in sample');}

	// fallback: built-in empty categories
	CATEGORIES.forEach(cat => data[cat] = []);
	saveData();
}

function saveData(){
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function render(){
	// split categories: first 3 to left, last 3 to right
	const left = document.getElementById('left-column');
	const right = document.getElementById('right-column');
	left.innerHTML = '';
	right.innerHTML = '';

	CATEGORIES.forEach((cat, idx) => {
		const container = document.createElement('section');
		container.className = 'category';
		const h = document.createElement('h2');
		h.textContent = CATEGORY_LABELS[cat] || cat;
		container.appendChild(h);

		const movies = document.createElement('div');
		movies.className = 'movies';

		if(!data[cat]) data[cat]=[];

		// ensure up to 7 visible items (if fewer, show empty placeholders)
		for(let i=0;i<7;i++){
			const movie = data[cat][i];
			const card = document.createElement('div');
			card.className = 'movie-card';
			if(movie){
				const title = document.createElement('div'); title.className='title'; title.textContent = movie.title;
				const meta = document.createElement('div'); meta.className='meta'; meta.textContent = `${movie.year || ''} ${movie.rating? '• ' + movie.rating: ''}`;
				const actions = document.createElement('div'); actions.className='actions';
				const editBtn = document.createElement('button'); editBtn.className='btn-icon'; editBtn.textContent='✏️';
				editBtn.title='Edit'; editBtn.onclick = ()=>openEditModal(cat,i);
				const delBtn = document.createElement('button'); delBtn.className='btn-icon'; delBtn.textContent='🗑️';
				delBtn.title='Delete'; delBtn.onclick = ()=>deleteMovie(cat,i);
				actions.appendChild(editBtn); actions.appendChild(delBtn);
				card.appendChild(actions);
				card.appendChild(title); card.appendChild(meta);
			}else{
				card.innerHTML = '<div class="empty">(empty slot)</div>';
			}
			movies.appendChild(card);
		}

		container.appendChild(movies);

		// add to left or right
		if(idx < 3) left.appendChild(container); else right.appendChild(container);
	});
}

function openAddModal(){
	editContext = null;
	document.getElementById('modal-title').textContent = 'Add Movie';
	fillCategoryOptions();
	document.getElementById('movie-form').reset();
	showModal();
}

function openEditModal(category, index){
	editContext = {category, index};
	document.getElementById('modal-title').textContent = 'Edit Movie';
	fillCategoryOptions(category);
	const movie = (data[category] && data[category][index]) || {title:'',year:'',rating:''};
	document.getElementById('movie-title').value = movie.title || '';
	document.getElementById('movie-year').value = movie.year || '';
	document.getElementById('movie-rating').value = movie.rating || '';
	document.getElementById('movie-category').value = category;
	showModal();
}

function deleteMovie(category, index){
	if(!data[category] || !data[category][index]) return;
	if(!confirm('Delete movie “'+data[category][index].title+'”?')) return;
	data[category].splice(index,1);
	saveData(); render();
}

function fillCategoryOptions(selected){
	const sel = document.getElementById('movie-category');
	sel.innerHTML = '';
	CATEGORIES.forEach(cat=>{
		const opt = document.createElement('option'); opt.value = cat; opt.textContent = CATEGORY_LABELS[cat]||cat;
		if(cat===selected) opt.selected = true;
		sel.appendChild(opt);
	});
}

function showModal(){ document.getElementById('modal').classList.remove('hidden'); }
function hideModal(){ document.getElementById('modal').classList.add('hidden'); }

function onSaveForm(e){
	e.preventDefault();
	const category = document.getElementById('movie-category').value;
	const title = document.getElementById('movie-title').value.trim();
	const year = document.getElementById('movie-year').value.trim();
	const rating = document.getElementById('movie-rating').value.trim();
	if(!title) return alert('Please provide a title');
	const movie = {title, year, rating};
	if(editContext){
		const {category:oldCat,index} = editContext;
		// if category changed, remove from old and add to new at same index
		if(oldCat === category){
			data[category][index] = movie;
		}else{
			if(data[oldCat] && data[oldCat][index]) data[oldCat].splice(index,1);
			data[category] = data[category] || [];
			data[category].push(movie);
		}
	}else{
		data[category] = data[category] || [];
		data[category].push(movie);
	}
	saveData(); hideModal(); render();
}

function exportData(){
	const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a'); a.href = url; a.download = 'movie-cinema-data.json'; document.body.appendChild(a); a.click(); a.remove();
	URL.revokeObjectURL(url);
}

function importFile(file){
	const reader = new FileReader();
	reader.onload = ()=>{
		try{
			const parsed = JSON.parse(reader.result);
			// basic validation: ensure keys
			CATEGORIES.forEach(cat=>{ if(!parsed[cat]) parsed[cat]=[] });
			data = parsed; saveData(); render();
			alert('Imported');
		}catch(e){ alert('Invalid JSON'); }
	};
	reader.readAsText(file);
}

function resetData(){
	if(!confirm('Reset all data to empty?')) return;
	data = {};
	CATEGORIES.forEach(cat=>data[cat]=[]);
	saveData(); render();
}

function wireUp(){
	document.getElementById('add-movie-btn').onclick = openAddModal;
	document.getElementById('cancel-btn').onclick = ()=>{ hideModal(); };
	document.getElementById('movie-form').onsubmit = onSaveForm;
	document.getElementById('export-btn').onclick = exportData;
	document.getElementById('reset-btn').onclick = resetData;
	document.getElementById('import-btn').onclick = ()=>document.getElementById('file-input').click();
	document.getElementById('file-input').onchange = (e)=>{ if(e.target.files[0]) importFile(e.target.files[0]); }
}

// init
window.addEventListener('DOMContentLoaded', async ()=>{
	await loadInitialData();
	wireUp();
	render();
});
