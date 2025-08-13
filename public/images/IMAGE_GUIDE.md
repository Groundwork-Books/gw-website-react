# Groundwork Books - Image Guide

This guide shows you exactly which images to add and where to place them to complete your homepage.

## 📁 Folder Structure
```
public/images/
├── hero/
│   └── book-collage.jpg        # Main hero background image
├── community/
│   ├── bookshelves.jpg         # Photo of bookstore shelves
│   ├── mural.jpg              # Photo of community mural/art
│   └── community-gathering.jpg # Photo of people in the space
├── events/
│   ├── bonfire-books.jpg      # Campfire/bonfire event photo
│   ├── coffee-meeting.jpg     # Coffee/food meeting photo
│   └── book-discussion.jpg    # Book club/discussion photo
└── social/
    ├── post-1.jpg             # Social media post 1
    ├── post-2.jpg             # Social media post 2
    ├── post-3.jpg             # Social media post 3
    ├── post-4.jpg             # Social media post 4
    ├── post-5.jpg             # Social media post 5
    ├── post-6.jpg             # Social media post 6
    ├── post-7.jpg             # Social media post 7
    └── post-8.jpg             # Social media post 8
```

## 🎯 Required Images

### 1. **Hero Section** (1 image)
- **File**: `public/images/hero/book-collage.jpg`
- **Description**: The main background collage showing vintage books and organizing materials
- **Recommended Size**: 1920x1080px (landscape)
- **This is the most important image - the main hero background**

### 2. **Community Photos** (3 images)
- **File**: `public/images/community/bookshelves.jpg`
  - Photo of your bookstore shelves/interior
  - Size: 800x600px (4:3 ratio)
  
- **File**: `public/images/community/mural.jpg`
  - Photo of community mural or wall art in your space
  - Size: 800x600px (4:3 ratio)
  
- **File**: `public/images/community/community-gathering.jpg`
  - Photo of people gathering/meeting in your space
  - Size: 800x600px (4:3 ratio)

### 3. **Events Carousel** (3 images)
- **File**: `public/images/events/bonfire-books.jpg`
  - Photo for "Bonfire & Books" event (campfire scene)
  - Size: 800x600px (4:3 ratio)
  
- **File**: `public/images/events/coffee-meeting.jpg`
  - Photo for "Dollar Launch Club" event (coffee/food scene)
  - Size: 800x600px (4:3 ratio)
  
- **File**: `public/images/events/book-discussion.jpg`
  - Photo for book discussion/club meeting
  - Size: 800x600px (4:3 ratio)

### 4. **Social Media Grid** (8 images)
- **Files**: `public/images/social/post-1.jpg` through `post-8.jpg`
- **Description**: Recent social media posts, photos from events, book highlights
- **Size**: 400x400px (square format)
- **These can be Instagram posts, book photos, event photos, etc.**

## 🚀 How to Add Images

1. **Save your images** with the exact filenames shown above
2. **Place them** in the correct folders as shown in the folder structure
3. **Restart your dev server** (`npm run dev`) after adding images
4. **The website will automatically use your images** instead of placeholders

## 📝 Image Tips

- **JPG format** is recommended for photos
- **PNG format** for images with transparency
- **Optimize images** for web (compress them to reduce file size)
- **Consistent aspect ratios** will look best
- **High resolution** images will look crisp on all devices

## ⚡ Quick Start

**Priority Order** (add these first for immediate impact):
1. `hero/book-collage.jpg` - Most important background image
2. `community/` folder images - Shows your physical space
3. `events/` folder images - Makes carousel functional
4. `social/` folder images - Completes the social section

Once you add these images, your homepage will be complete and match your Figma design perfectly!

## 🔧 After Adding Images

The code will automatically:
- Use your hero image as the main background
- Display your community photos in the 3-column section
- Show your event images in the carousel
- Populate the social media grid with your posts

No code changes needed - just add the images and refresh!