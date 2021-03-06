const { buildSchema } = require('graphql');

module.exports = buildSchema(`
	type Post{
		_id: ID!
		title: String!
		content: String!
		imageUrl: String!
		creator: User!
		createdAt: String!
		updatedAt: String!
	}

	type User {
		_id: ID!
		name: String!
		email: String!
		password: String
		status: String!
		posts: [Post!]!
	}

	type authData{
		token: String!
		userId: String!
	}

	type PostsData {
		posts: [Post!]!
		totalPosts: Int!
	}

	input UserInputData {
		email: String!
		name: String!
		password: String!
	}

	input PostInputData {
		title: String
		content: String
		imageUrl: String
	}

	type RootMutation {
		createUser(userInput: UserInputData): User!
		createPost(postInput: PostInputData): Post!
		updatePost(id: String!, postInput: PostInputData): Post!
		deletePost(id: String!): Boolean
		updateStatus(status: String!): User!
	}

	type RootQuery{
		login(email: String!, password: String!): authData!
		posts(page: Int): PostsData!
		post(id: String!): Post!
		user: User!
	}

	schema {
		query: RootQuery
		mutation: RootMutation
	}
`);
