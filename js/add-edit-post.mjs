import postsAPI from './api/postApi.js'
import AppConstants from './appConstants.js'
import utils from './utils.js'

const setPostFormValues = (post) => {
	// Set title
	utils.setValueByElementId('postTitle', post.title)

	// Set author
	utils.setValueByElementId('postAuthor', post.author)

	// Set description
	utils.setValueByElementId('postDescription', post.description)

	// Set image
	utils.setBackgroundImageByElementId('postHeroImage', post.imageUrl)
}

const getPostFormValues = () => {
	const formValues = {
		title: utils.getValueByElementId('postTitle'),
		author: utils.getValueByElementId('postAuthor'),
		description: utils.getValueByElementId('postDescription'),
		imageUrl: utils.getBackgroundImageByElementId('postHeroImage'),
	}

	return formValues
}

const handleChangeImageClick = () => {
	const randomId = 1 + Math.trunc(Math.random() * 1000)

	const imageUrl = `https://picsum.photos/id/${randomId}/${AppConstants.DEFAULT_IMAGE_WIDTH}/${AppConstants.DEFAULT_IMAGE_HEIGHT}`

	utils.setBackgroundImageByElementId('postHeroImage', imageUrl)
}

const validatePostForm = () => {
	let isValid = true

	// title is required
	const title = utils.getValueByElementId('postTitle')
	if (!title) {
		utils.addClassByElementId('postTitle', ['is-invalid'])
		isValid = false
	}

	// author is required
	const author = utils.getValueByElementId('postAuthor')
	if (!author) {
		utils.addClassByElementId('postAuthor', ['is-invalid'])
		isValid = false
	}

	return isValid
}

const handlePostFormSubmit = async (postId) => {
	const formValues = getPostFormValues()

	// Form validation
	const isValid = validatePostForm()
	if (isValid) {
		try {
			// Add/update
			const temp = {
				id: postId,
				...formValues,
			}

			if (postId) {
				await postsAPI.update(temp)
				utils.showNotification('Save post successfully', 0)
			} else {
				const newPost = await postsAPI.add(temp)

				// Go to edit page
				const editPageUrl = `add-edit-post.html?postId=${newPost.id}`
				window.location = editPageUrl

				utils.showNotification('Add new post successfully', 0)
			}
		} catch (error) {
			utils.showNotification(`Failed to save post: ${error}`, 1)
			alert('Failed to save post: ', error)
		}
	}
}

;(async function () {
	let search = window.location.search

	search = search ? search.substring(1) : ''

	const {postId} = utils.parseUrlString(search)
	const isEditMode = !!postId

	if (isEditMode) {
		// get post data
		const post = await postsAPI.get(postId)
		setPostFormValues(post)

		// show button detail page link
		const goToDetailPageLink = document.querySelector('#goToDetailPageLink')
		if (goToDetailPageLink) {
			goToDetailPageLink.href = `post-detail.html?id=${postId}`
			goToDetailPageLink.innerHTML = '<i class="fas fa-eye mr-1"></i> View post detail'
		}
	} else {
		// use when add new post
		handleChangeImageClick()
	}

	// hide loader
	const loaderElement = document.querySelector('.loader')
	if (loaderElement) loaderElement.classList.add('hide')

	const postChangeImageButton = document.querySelector('#postChangeImage')
	if (postChangeImageButton) {
		postChangeImageButton.addEventListener('click', handleChangeImageClick)
	}

	// Handle form submit button
	const postForm = document.querySelector('#postForm')
	if (postForm) {
		postForm.addEventListener('submit', (e) => {
			handlePostFormSubmit(postId)
			e.preventDefault()
		})
	}
})()
