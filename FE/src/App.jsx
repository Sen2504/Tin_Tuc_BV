import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminLayout from "./layouts/AdminLayout";
import UserListPage from "./pages/UserListPage";
import CreateUserPage from "./pages/CreateUserPage";
import CategoryListPage from "./pages/CategoryListPage";
import CategoryCreatePage from "./pages/CategoryCreatePage";
import CategoryUpdatePage from "./pages/CategoryUpdatePage";
import SubCategoryListPage from "./pages/SubCategoryListPage";
import SubCategoryCreatePage from "./pages/SubCategoryCreatePage";
import SubCategoryUpdatePage from "./pages/SubCategoryUpdatePage";
import CreatePostPage from "./pages/CreatePostPage";
import CategoryPage from "./pages/CategoryPage";
import SubCategoryPage from "./pages/SubCategoryPage";
import PostPage from "./pages/PostPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các trang có dùng MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/Homepage" element={<HomePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/:categorySlug" element={<CategoryPage />} />
          <Route path="/:categorySlug/:subcategorySlug" element={<SubCategoryPage />} />
          <Route path="/:categorySlug/:subcategorySlug/:postSlug" element={<PostPage />} />
        </Route>
        
        {/* Các trang có dùng AdminLayout */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<div />} />
          <Route path="/user/list" element={<UserListPage />} />
          <Route path="/user/create" element={<CreateUserPage />} />

          <Route path="/category/list" element={<CategoryListPage />} />
          <Route path="/category/create" element={<CategoryCreatePage />} />
          <Route path="/category/update/:id" element={<CategoryUpdatePage />} />

          <Route path="/subcategory/list" element={<SubCategoryListPage />} />
          <Route path="/subcategory/create" element={<SubCategoryCreatePage />} />
          <Route path="/subcategory/update/:id" element={<SubCategoryUpdatePage />} />
          
          <Route path="/post/create" element={<CreatePostPage />} />

        </Route>

        {/* Trang login để riêng, thường không cần header/footer */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}