import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import { elements, rendererLoader, clearLoader } from './views/base';
import * as searchView from './views/searchView';
import * as recipieView from './views/recipieView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import Likes from './models/Likes';

/*Global state of app
Search object
Current recipe 
Shopping list
liked recipes
*/

const state = {};

const controlSearch = async () => {
    // 1 get query from the view
    const query = searchView.getInput();

    if (query) {
        // 2) new search objects and add to state
        state.search = new Search(query);
    }

    //3) Clear previous results or show load spinner
    searchView.clearInput();
    searchView.clearResults();
    rendererLoader(elements.searchRes);

    //4) Perform search
    try {
        await state.search.getResults();
    } catch (error) {
        alert('Error processing the search...');
        clearLoader();
    }

    //5) render results
    clearLoader();
    searchView.renderResults(state.search.result);
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
})

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline'); //finds the closest element with tht class
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
})

/***
 * Recipe Controller
 */
const controlRecipe = async () => {
    //Get id from url
    const id = window.location.hash.replace('#', '');

    if (id) {
        //prepare ui for changes
        recipieView.clearRecipe();
        rendererLoader(elements.recipe);

        //highligte selected
        if (state.search) searchView.highlightSelected(id);

        //create new recipoe object
        state.recipe = new Recipe(id);

        //get recipe data
        try {
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //calculate size an dservings
            state.recipe.calcTime();
            state.recipe.calcServings();

            //render recipe
            clearLoader();
            recipieView.renderRecipe(state.recipe, state.likes.isLiked(id));
        } catch (error) {
            console.log(error);
            alert('Error processing recipe!');
        }
    }

}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * List Controller
 */
const controlList = () => {
    //create a new list if none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}


//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    //goes to the closet shopping item and gets the id
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // is our target the delete button?
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete from state
        state.list.deleteItem(id);
        //delete from ui
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});


/**
 * Likes Controller
 */
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //user has not yet liked recipe
    if (!state.likes.isLiked(currentID)) {
        //Add like to the data
        const newLike = state.likes.addLike(currentID, state.recipe.title, state.recipe.author, state.recipe.img);
        //toggle the like button
        likesView.toggleLikeBtn(true);

        //Add like to the UI list
        likesView.renderLike(newLike);
        //User has current recipe
    } else {
        //Remove like from state
        state.likes.deleteLike(currentID);
        //toggle like btn
        likesView.toggleLikeBtn(false);
        //remove from UI
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

window.addEventListener('load', () => {
    state.likes = new Likes();
    state.likes.readStorage();
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

//handly recipe button  clicks
elements.recipe.addEventListener('click', e => {
    // it target are buttons or the children
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        //Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipieView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        //Increase button is clicked
        state.recipe.updateServings('inc');
        recipieView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn *')) {
        //Add ingedeient to controllist
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        //Add recipe to likes
        controlLike();
    }

})