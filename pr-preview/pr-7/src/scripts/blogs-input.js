// Simple Markdown parser
function parseMarkdown(text) {
  // Headers (# becomes h2, ## becomes h3, etc.)
  text = text.replace(/^##### (.*$)/gim, '<h6>$1</h6>');
  text = text.replace(/^#### (.*$)/gim, '<h5>$1</h5>');
  text = text.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  text = text.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^# (.*$)/gim, '<h2>$1</h2>');

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Code blocks
  text = text.replace(/```(.*?)```/gis, '<pre><code>$1</code></pre>');

  // Inline code
  text = text.replace(/`(.*?)`/gim, '<code>$1</code>');

  // Links
  text = text.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>');

  // Line breaks
  text = text.replace(/\n\n/g, '</p><p>');
  text = text.replace(/\n/g, '<br>');

  // Wrap in paragraphs
  text = '<p>' + text + '</p>';

  return text;
}

// Get form elements
const blogForm = document.getElementById('blog-form');
const formSection = document.getElementById('blog-form-section');
const previewSection = document.getElementById('blog-preview-section');
const successSection = document.getElementById('success-section');

// Preview elements
const previewTitle = document.getElementById('preview-title');
const previewAuthor = document.getElementById('preview-author');
const previewDate = document.getElementById('preview-date');
const previewContent = document.getElementById('preview-content');
const previewTags = document.getElementById('preview-tags');
const previewCoverImage = document.getElementById('preview-cover-image');

// Buttons
const editBlogBtn = document.getElementById('edit-blog');
const submitBlogBtn = document.getElementById('submit-blog');

// Image elements
const coverImageInput = document.getElementById('blog-cover-file');
const blogImagesInput = document.getElementById('blog-images');
const imagesPreviewContainer = document.getElementById('images-preview-container');
const imagesPreviewList = document.getElementById('images-preview-list');

// Cropper modal elements
const cropperModal = document.getElementById('cropper-modal');
const cropperImage = document.getElementById('cropper-image');
const closeCropperBtn = document.getElementById('close-cropper');
const cancelCropBtn = document.getElementById('cancel-crop');
const applyCropBtn = document.getElementById('apply-crop');

let currentBlogData = {};
let cropperInstance = null;
let blogImages = []; // Array to store {filename, base64, alt}

// Cover image cropper
coverImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      cropperImage.src = event.target.result;
      cropperModal.style.display = 'flex';

      // Initialize cropper
      if (cropperInstance) {
        cropperInstance.destroy();
      }
      cropperInstance = new Cropper(cropperImage, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
        background: false,
      });
    };
    reader.readAsDataURL(file);
  }
});

// Close cropper modal
function closeCropperModal() {
  cropperModal.style.display = 'none';
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  // Don't reset file input so it shows the selected file name
}

closeCropperBtn.addEventListener('click', closeCropperModal);
cancelCropBtn.addEventListener('click', closeCropperModal);

// Apply crop
applyCropBtn.addEventListener('click', () => {
  if (cropperInstance) {
    const canvas = cropperInstance.getCroppedCanvas({
      width: 800,
      height: 800,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    currentBlogData.coverImage = canvas.toDataURL('image/jpeg', 0.9);
    closeCropperModal();
    alert('Cover image cropped successfully!');
  }
});

// Handle multiple blog images
blogImagesInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = {
        filename: file.name,
        base64: event.target.result,
        alt: ''
      };
      blogImages.push(imageData);
      addImagePreview(imageData, blogImages.length - 1);
    };
    reader.readAsDataURL(file);
  });

  if (files.length > 0) {
    imagesPreviewContainer.style.display = 'block';
  }
});

// Add image preview
function addImagePreview(imageData, index) {
  const previewItem = document.createElement('div');
  previewItem.className = 'image-preview-item';
  previewItem.dataset.index = index;

  previewItem.innerHTML = `
    <button type="button" class="remove-image-btn" onclick="removeImage(${index})">&times;</button>
    <img src="${imageData.base64}" alt="Preview">
    <input type="text" placeholder="Enter alt text..." value="${imageData.alt}" 
           onchange="updateImageAlt(${index}, this.value)">
    <div class="image-filename">${imageData.filename}</div>
  `;

  imagesPreviewList.appendChild(previewItem);
}

// Update image alt text
window.updateImageAlt = function (index, alt) {
  if (blogImages[index]) {
    blogImages[index].alt = alt;
  }
};

// Remove image
window.removeImage = function (index) {
  blogImages.splice(index, 1);
  renderImagePreviews();

  if (blogImages.length === 0) {
    imagesPreviewContainer.style.display = 'none';
    blogImagesInput.value = ''; // Reset file input
  }
};

// Render all image previews
function renderImagePreviews() {
  imagesPreviewList.innerHTML = '';
  blogImages.forEach((imageData, index) => {
    addImagePreview(imageData, index);
  });
}

// Handle form submission for preview
blogForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get form data
  const formData = new FormData(blogForm);

  updatePreview(formData);
});

function updatePreview(formData) {
  currentBlogData = {
    authorName: formData.get('authorName'),
    authorEmail: formData.get('authorEmail'),
    authorBio: formData.get('authorBio'),
    blogTitle: formData.get('blogTitle'),
    // category: formData.get('category'),
    coverImage: currentBlogData.coverImage || null, // Use cropped image
    blogContent: formData.get('blogContent'),
    tags: formData.get('tags'),
    images: blogImages, // Include all blog images
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };

  // Populate preview
  previewTitle.textContent = currentBlogData.blogTitle;
  previewAuthor.textContent = `By ${currentBlogData.authorName}`;
  previewDate.textContent = currentBlogData.date;
  // previewCategory.textContent = currentBlogData.category.charAt(0).toUpperCase() + currentBlogData.category.slice(1);

  // Cover image
  if (currentBlogData.coverImage) {
    previewCoverImage.innerHTML = `<img src="${currentBlogData.coverImage}" alt="${currentBlogData.blogTitle}" style="max-width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 2rem;">`;
  } else {
    previewCoverImage.innerHTML = '';
  }

  // Parse and display content
  previewContent.innerHTML = parseMarkdown(currentBlogData.blogContent);

  // Display tags
  if (currentBlogData.tags) {
    const tagsArray = currentBlogData.tags.split(',').map(tag => tag.trim());
    previewTags.innerHTML = tagsArray.map(tag => `<span class="tag">#${tag}</span>`).join('');
  } else {
    previewTags.innerHTML = '';
  }

  // Show preview, hide form
  formSection.style.display = 'none';
  previewSection.style.display = 'block';
  successSection.style.display = 'none';

  // Scroll to preview
  previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Edit blog button
editBlogBtn.addEventListener('click', () => {
  formSection.style.display = 'block';
  previewSection.style.display = 'none';
  successSection.style.display = 'none';
  formSection.scrollIntoView({ behavior: 'smooth' });
});

// Submit blog button
submitBlogBtn.addEventListener('click', async () => {
  // Basic validation
  if (!currentBlogData.blogTitle || !currentBlogData.blogContent) {
    alert('Please provide at least a title and content.');
    return;
  }

  // Show loading state
  const originalText = submitBlogBtn.textContent;
  submitBlogBtn.textContent = 'Submitting...';
  submitBlogBtn.disabled = true;

  try {
    if (!window.githubClient) throw new Error('GithubClient not loaded');

    const data = {
      title: currentBlogData.blogTitle,
      content: currentBlogData.blogContent,
      author: currentBlogData.authorName,
      email: currentBlogData.authorEmail,
      tags: currentBlogData.tags ? currentBlogData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      description: currentBlogData.blogTitle + ' by ' + currentBlogData.authorName,
      // category: currentBlogData.category,
      coverImageBase64: currentBlogData.coverImage, // Pass the base64 string
      images: currentBlogData.images || [] // Pass all blog images
    };

    const htmlUrl = await window.githubClient.submitBlog(data);
    console.log('Blog submitted successfully:', htmlUrl);

    // Show success message
    document.getElementById('confirm-email').textContent = currentBlogData.authorEmail || 'your email';

    formSection.style.display = 'none';
    previewSection.style.display = 'none';
    successSection.style.display = 'block';
    successSection.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('Error submitting blog:', error);
    if (error.message.includes('401') || error.message.includes('token')) {
      alert('Authentication failed or token missing. Please enter your GitHub Token when prompted.');
      await window.githubClient.requireToken();
      // Optionally retry? For now, just let them click submit again.
    } else {
      alert(`Error: ${error.message}`);
    }
  } finally {
    submitBlogBtn.textContent = originalText;
    submitBlogBtn.disabled = false;
  }
});