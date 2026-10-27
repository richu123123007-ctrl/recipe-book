
import { useEffect, useMemo, useState } from "react";
import "./App.css";

// Connect the Vercel frontend to your Render backend.
const API = "https://recipe-book-17ud.onrender.com/api/recipes";

const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];

const EMPTY_FORM = {
  name: "",
  category: "Breakfast",
  ingredients: "",
  steps: "",
  cookingTime: "",
};

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  async function loadRecipes() {
    try {
      const response = await fetch(API);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load recipes.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from the recipe server.");
      }

      setRecipes(data);
      setNotice((current) =>
        current?.type === "error" ? null : current
      );
    } catch (error) {
      setNotice({
        type: "error",
        text: `${error.message} Check your backend connection and CORS settings.`,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        (recipe.name || "").toLowerCase().includes(term) ||
        (recipe.ingredients || "").toLowerCase().includes(term);

      return matchesSearch &&
        (filter === "All" || recipe.category === filter);
    });
  }, [recipes, search, filter]);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    const cookingTime = Number(form.cookingTime);

    if (
      !form.name.trim() ||
      !form.ingredients.trim() ||
      !form.steps.trim() ||
      !Number.isInteger(cookingTime) ||
      cookingTime < 1
    ) {
      setNotice({
        type: "error",
        text: "Complete every field. Cooking time must be a positive whole number.",
      });
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      ingredients: form.ingredients.trim(),
      steps: form.steps.trim(),
      cookingTime,
    };

    setSaving(true);

    try {
      const response = await fetch(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save recipe.");
      }

      setNotice({
        type: "success",
        text: editingId
          ? "Recipe updated successfully!"
          : "Recipe added successfully!",
      });

      resetForm();
      await loadRecipes();
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Unable to connect to the recipe server.",
      });
    } finally {
      setSaving(false);
    }
  }

  function editRecipe(recipe) {
    setEditingId(recipe._id);

    setForm({
      name: recipe.name || "",
      category: recipe.category || "Breakfast",
      ingredients: recipe.ingredients || "",
      steps: recipe.steps || "",
      cookingTime: String(recipe.cookingTime || ""),
    });

    setSelected(null);

    document
      .getElementById("recipe-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function deleteRecipe(recipe) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${recipe.name}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API}/${recipe._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete recipe.");
      }

      setRecipes((current) =>
        current.filter((item) => item._id !== recipe._id)
      );

      if (selected?._id === recipe._id) {
        setSelected(null);
      }

      if (editingId === recipe._id) {
        resetForm();
      }

      setNotice({
        type: "success",
        text: "Recipe deleted successfully!",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Unable to delete recipe.",
      });
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">✳</span> recipe<span>book</span>
        </a>
        <a className="top-link" href="#recipe-form">
          + Add a recipe
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">YOUR PERSONAL COOKBOOK</p>
            <h1>
              Good food.
              <br />
              <span>Great memories.</span>
            </h1>
            <p className="hero-description">
              Keep your favourite recipes in one place, ready whenever
              inspiration strikes.
            </p>
            <a className="button button-primary" href="#recipe-form">
              ＋ Create a recipe
            </a>
          </div>

          <div
            className="hero-art"
            aria-label="Illustration of a delicious meal"
          >
            <div className="plate">
              <span>🥗</span>
            </div>
            <span className="art-spark spark-one">✦</span>
            <span className="art-spark spark-two">✧</span>
            <span className="art-caption">Made with love</span>
          </div>
        </section>

        <section className="collection section-wrap" id="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE GOOD STUFF</p>
              <h2>
                Your recipe collection{" "}
                <span className="count">{recipes.length}</span>
              </h2>
              <p className="muted">
                Everyday favourites, all in one delicious place.
              </p>
            </div>
          </div>

          <div className="filters">
            <label className="search-field">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search recipes or ingredients..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {notice && (
            <div className={`notice ${notice.type}`} role="status">
              {notice.text}
              <button
                onClick={() => setNotice(null)}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              <h3>Loading your recipes...</h3>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-emoji">🍲</span>
              <h3>
                {recipes.length
                  ? "No recipes found"
                  : "Your cookbook starts here"}
              </h3>
              <p>
                {recipes.length
                  ? "Try another search or category."
                  : "Add your first favourite recipe."}
              </p>
              {!recipes.length && (
                <a className="button button-primary" href="#recipe-form">
                  Add your first recipe
                </a>
              )}
            </div>
          ) : (
            <div className="recipe-grid">
              {filteredRecipes.map((recipe, index) => (
                <article className="recipe-card" key={recipe._id}>
                  <button
                    className={`recipe-art art-${index % 5}`}
                    onClick={() => setSelected(recipe)}
                    aria-label={`View ${recipe.name}`}
                  >
                    <span>
                      {["🥘", "🥑", "🍓", "🍝", "🥞"][index % 5]}
                    </span>
                    <span className="art-arrow">↗</span>
                  </button>

                  <div className="card-body">
                    <span className="category">{recipe.category}</span>
                    <button
                      className="recipe-name"
                      onClick={() => setSelected(recipe)}
                    >
                      {recipe.name}
                    </button>
                    <p className="recipe-meta">
                      ◷ {recipe.cookingTime} min <span>·</span> Homemade
                    </p>

                    <div className="card-bottom">
                      <button
                        className="text-link"
                        onClick={() => setSelected(recipe)}
                      >
                        View details →
                      </button>
                      <div className="card-tools">
                        <button
                          title="Edit recipe"
                          onClick={() => editRecipe(recipe)}
                        >
                          ✎
                        </button>
                        <button
                          title="Delete recipe"
                          onClick={() => deleteRecipe(recipe)}
                        >
                          ⌫
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="form-section" id="recipe-form">
          <div className="form-intro">
            <p className="eyebrow">A PINCH OF LOVE</p>
            <h2>{editingId ? "Edit your recipe" : "Add a little flavour"}</h2>
            <p className="muted">
              Save the ingredients and steps for a dish you love.
            </p>
            <div className="form-emoji">🥬　🍋　🌿</div>
          </div>

          <form className="recipe-form" onSubmit={handleSubmit}>
            <label className="field full">
              Recipe name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Creamy tomato pasta"
                maxLength="100"
                required
              />
            </label>

            <div className="form-row">
              <label className="field">
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                Cooking time (minutes)
                <input
                  name="cookingTime"
                  type="number"
                  min="1"
                  step="1"
                  value={form.cookingTime}
                  onChange={handleChange}
                  placeholder="e.g. 25"
                  required
                />
              </label>
            </div>

            <label className="field full">
              Ingredients
              <textarea
                name="ingredients"
                value={form.ingredients}
                onChange={handleChange}
                placeholder="List ingredients, one per line..."
                rows="4"
                required
              />
            </label>

            <label className="field full">
              Preparation steps
              <textarea
                name="steps"
                value={form.steps}
                onChange={handleChange}
                placeholder="Write the preparation steps in order..."
                rows="5"
                required
              />
            </label>

            <div className="form-footer">
              <span>✳ Made with a pinch of love</span>
              <div className="form-actions">
                {editingId && (
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save changes →"
                    : "Save recipe →"}
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>

      <footer className="footer">
        <a className="brand" href="#">
          <span className="brand-mark">✳</span> recipe<span>book</span>
        </a>
        <p>A little place for the things you love to cook.</p>
        <span>Made for your kitchen ♡</span>
      </footer>

      {selected && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            <button
              className="modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-art">
              <span>🍽️</span>
            </div>

            <div className="modal-body">
              <span className="category">{selected.category}</span>
              <h2 id="detail-title">{selected.name}</h2>
              <p className="recipe-meta">
                ◷ {selected.cookingTime} minutes
              </p>

              <h3>Ingredients</h3>
              <p className="detail-text">{selected.ingredients}</p>

              <h3>Preparation steps</h3>
              <p className="detail-text">{selected.steps}</p>

              <div className="form-actions">
                <button
                  className="button button-secondary"
                  onClick={() => editRecipe(selected)}
                >
                  ✎ Edit
                </button>
                <button
                  className="button button-danger"
                  onClick={() => deleteRecipe(selected)}
                >
                  Delete recipe
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
