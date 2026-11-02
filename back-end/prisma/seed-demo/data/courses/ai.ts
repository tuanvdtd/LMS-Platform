import type { SeedCourse } from '../types.ts';

export const COURSES: SeedCourse[] = [
  {
    instructorEmail: 'daniel.park@skillpath.test',
    categorySlug: 'machine-learning',
    topics: [{ slug: 'pytorch', primary: true }, { slug: 'deep-learning' }, { slug: 'python' }],
    language: 'en',
    level: 'intermediate',
    priceAmount: 999_000,
    status: 'published',
    title: 'Deep Learning with PyTorch: From Tensors to Trained Models',
    subtitle: 'Build, train and debug neural networks in PyTorch, from raw tensors to a working image classifier',
    description:
      "Most deep learning tutorials stop at copying a model definition and calling it done. The moment your loss turns into NaN, your accuracy sits at 10% or a shape mismatch error points at a line you did not write, you are on your own. This course is built around that moment. We write every part of the training process ourselves in PyTorch so that you understand what each line does and can fix it when it breaks.\n\nWe start with tensors: shapes, dtypes, devices and the broadcasting rules that cause half of all beginner bugs. From there we open up autograd to see how loss.backward() really fills in gradients, build models with nn.Module, and write a clean, reusable training loop with DataLoader, optimizers and a validation step. In the second half we move to convolutional networks and train an image classifier on a public dataset, then tackle the practical problems that decide whether a model is useful: overfitting, learning-rate choice, checkpointing and inference.\n\nWhat you will be able to do by the end:\n• Read and reason about tensor shapes through every layer of a network\n• Write a training loop from scratch, without a high-level wrapper hiding the details\n• Diagnose common failures such as exploding loss, overfitting and data leaking into validation\n• Save, reload and run a trained model for inference outside the notebook\n\nEach lecture pairs a short explanation with code you run yourself, and the coding exercise asks you to implement softmax and cross-entropy by hand so the numbers inside nn.CrossEntropyLoss stop being a black box. The course assumes you already know Python and some basic machine learning vocabulary, and it focuses on understanding over memorizing APIs, so the skills carry over when the library changes.",
    learningObjectives: [
      'Manipulate tensors on CPU and GPU and predict output shapes, including broadcasting',
      'Explain how autograd builds the computation graph and computes gradients with backward()',
      'Implement a complete training and validation loop with DataLoader, an optimizer and a loss function',
      'Build and train a convolutional neural network for image classification',
      'Reduce overfitting with dropout, weight decay, augmentation and learning-rate schedules',
      'Save checkpoints and run a trained model in inference mode',
    ],
    requirements: [
      'Comfortable writing Python functions, classes and list comprehensions',
      'Basic idea of what training a model means (inputs, labels, loss)',
    ],
    targetAudience: [
      'Python developers who want to move from classical ML into deep learning',
      'Students who have used Keras or a high-level wrapper and want to understand what happens underneath',
    ],
    thumbnail: { label: 'PyTorch', tagline: 'Tensors to trained models' },
    sections: [
      {
        title: 'Getting Started with PyTorch',
        lectures: [
          'Course overview and setting up PyTorch with a GPU check',
          'Tensors: shapes, dtypes, devices and broadcasting',
        ],
      },
      {
        title: 'Training Fundamentals',
        lectures: [
          'Autograd: how loss.backward() computes gradients',
          'Building models with nn.Module and nn.Sequential',
          'Softmax, cross-entropy and why the loss expects raw logits',
          'Writing a clean training loop with DataLoader and an optimizer',
        ],
      },
      {
        title: 'Convolutional Neural Networks',
        lectures: [
          'Conv2d, pooling and reading feature map shapes',
          'Training a CNN on an image dataset with data augmentation',
        ],
      },
      {
        title: 'Making Models Work in Practice',
        lectures: [
          'Overfitting, dropout, weight decay and learning-rate schedules',
          'Saving checkpoints, model.eval() and running inference',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: PyTorch training essentials',
      description: 'Check your understanding of gradients, losses, CNN shapes and regularization.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Why do we call optimizer.zero_grad() at the start of every training iteration?',
          relatedLecture: 5,
          options: [
            {
              content: 'Because PyTorch adds new gradients to the existing .grad values instead of replacing them',
              correct: true,
              explanation: 'Gradients accumulate by default, so without resetting them each step would use the sum of all previous gradients.',
            },
            {
              content: 'To reset the model weights to their initial values',
              explanation: 'zero_grad() only clears the .grad buffers; the weights themselves are untouched.',
            },
            {
              content: 'To lower the learning rate gradually during training',
              explanation: 'Changing the learning rate is the job of a learning-rate scheduler, not zero_grad().',
            },
            {
              content: 'It is only needed when training on a GPU',
              explanation: 'Gradient accumulation happens on every device, so the call is needed on CPU as well.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What should you pass as the first argument to nn.CrossEntropyLoss?',
          relatedLecture: 4,
          options: [
            {
              content: 'Raw logits straight from the last linear layer',
              correct: true,
              explanation: 'CrossEntropyLoss applies log-softmax internally, so it expects unnormalized scores.',
            },
            {
              content: 'Probabilities after applying softmax',
              explanation: 'Applying softmax first means it is effectively applied twice, which distorts the loss and slows learning.',
            },
            {
              content: 'One-hot encoded predictions rounded to 0 or 1',
              explanation: 'Rounded predictions are not differentiable and carry no confidence information for the gradient.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Your training accuracy keeps rising while validation accuracy has dropped for several epochs. Which actions help?',
          relatedLecture: 8,
          options: [
            {
              content: 'Add dropout layers',
              correct: true,
              explanation: 'Dropout randomly disables units during training, which discourages the network from memorizing the training set.',
            },
            {
              content: 'Add weight decay to the optimizer',
              correct: true,
              explanation: 'Weight decay penalizes large weights and is a standard way to reduce overfitting.',
            },
            {
              content: 'Use data augmentation such as random crops and flips',
              correct: true,
              explanation: 'Augmentation shows the model more varied inputs, so it generalizes better to unseen images.',
            },
            {
              content: 'Train for many more epochs',
              explanation: 'The model is already overfitting; more epochs usually make the gap between train and validation larger.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'An input batch has shape (8, 3, 32, 32). What is the output shape of nn.Conv2d(3, 16, kernel_size=3) with default stride and no padding?',
          relatedLecture: 6,
          options: [
            {
              content: '(8, 16, 30, 30)',
              correct: true,
              explanation: 'With stride 1 and no padding each spatial side shrinks by kernel_size - 1, so 32 becomes 30, and there are 16 output channels.',
            },
            {
              content: '(8, 16, 32, 32)',
              explanation: 'The size stays 32 only with padding=1; the default padding is 0.',
            },
            {
              content: '(8, 3, 30, 30)',
              explanation: 'The number of output channels is set by out_channels, which is 16 here.',
            },
            {
              content: '(16, 3, 30, 30)',
              explanation: 'The batch dimension is preserved; 16 describes channels, not the batch size.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What does calling model.eval() change before running inference?',
          relatedLecture: 9,
          options: [
            {
              content: 'Layers such as dropout and batch normalization switch to their inference behaviour',
              correct: true,
              explanation: 'eval() turns dropout off and makes batch norm use its running statistics instead of batch statistics.',
            },
            {
              content: 'It stops PyTorch from tracking gradients',
              explanation: 'Disabling gradient tracking is done with torch.no_grad() or torch.inference_mode(), not eval().',
            },
            {
              content: 'It freezes the weights so the optimizer cannot update them',
              explanation: 'eval() does not touch requires_grad; an optimizer could still update the weights.',
            },
            {
              content: 'It moves the model from the GPU to the CPU',
              explanation: 'Device placement is controlled with .to(device), independently of train or eval mode.',
            },
          ],
        },
      ],
    },
    exercise: {
      title: 'Softmax and cross-entropy by hand',
      learningObjective: 'Compute softmax probabilities and the mean cross-entropy loss from raw logits in a numerically stable way',
      instructions:
        'Implement the computation that nn.CrossEntropyLoss performs.\n\nInput: the first line has two integers n and k (number of samples and number of classes). Each of the next n lines has k logits (real numbers) followed by the index of the true class (0-based).\n\nFor each sample print one line "pred=<p> probs=<p0> <p1> ...", where pred is the index of the largest probability (the smallest index wins a tie) and every probability is formatted with exactly 4 decimals. After all samples print "loss=<value>": the mean of -ln(probability of the true class), formatted with 4 decimals.\n\nSubtract the maximum logit before calling exp so that large logits such as 1000 do not overflow.\n\nExample input:\n2 3\n2.0 1.0 0.1 0\n0.5 2.5 0.3 1\n\nExample output:\npred=0 probs=0.6590 0.2424 0.0986\npred=1 probs=0.1086 0.8025 0.0889\nloss=0.3185',
      hints: [
        'softmax(x) does not change if you subtract the same constant from every logit, so subtract max(x) first.',
        'list.index(max(values)) returns the first position of the maximum, which handles ties.',
        "Use Python's format spec f\"{value:.4f}\" to print exactly 4 decimals.",
      ],
      solutionExplanation:
        'For each row we subtract the largest logit, exponentiate, and divide by the sum to get probabilities; this is mathematically identical to the plain softmax but never overflows. The loss for a sample is the negative natural log of the probability assigned to the true class, and the final loss is the average over all samples, exactly what nn.CrossEntropyLoss returns with reduction="mean".',
      difficulty: 'medium',
      relatedLecture: 4,
      code: [
        {
          language: 'python',
          starter: `import sys
import math


def softmax(logits):
    # TODO: return a list of probabilities that sum to 1
    return []


def main():
    data = sys.stdin.read().split()
    n, k = int(data[0]), int(data[1])
    # TODO: read each row of k logits plus the true label,
    # print pred/probs per row and the mean loss at the end


main()
`,
          solution: `import sys
import math


def softmax(logits):
    m = max(logits)
    exps = [math.exp(x - m) for x in logits]
    total = sum(exps)
    return [e / total for e in exps]


def main():
    data = sys.stdin.read().split()
    n, k = int(data[0]), int(data[1])
    pos = 2
    total_loss = 0.0
    for _ in range(n):
        logits = [float(x) for x in data[pos:pos + k]]
        label = int(data[pos + k])
        pos += k + 1
        probs = softmax(logits)
        pred = probs.index(max(probs))
        total_loss += -math.log(probs[label])
        print("pred=" + str(pred) + " probs=" + " ".join(f"{p:.4f}" for p in probs))
    print(f"loss={total_loss / n:.4f}")


main()
`,
        },
      ],
      tests: [
        {
          input: '2 3\n2.0 1.0 0.1 0\n0.5 2.5 0.3 1\n',
          expectedOutput: 'pred=0 probs=0.6590 0.2424 0.0986\npred=1 probs=0.1086 0.8025 0.0889\nloss=0.3185',
          isPublic: true,
        },
        {
          input: '1 4\n0 0 0 0 2\n',
          expectedOutput: 'pred=0 probs=0.2500 0.2500 0.2500 0.2500\nloss=1.3863',
          isPublic: true,
        },
        {
          input: '2 2\n1000 1001 1\n-3.5 -1.5 0\n',
          expectedOutput: 'pred=1 probs=0.2689 0.7311\npred=1 probs=0.1192 0.8808\nloss=1.2201',
          isPublic: false,
        },
        {
          input: '3 3\n1.2 0.4 -0.8 0\n0.0 0.0 3.0 2\n2.0 2.0 1.0 1\n',
          expectedOutput:
            'pred=0 probs=0.6310 0.2835 0.0854\npred=2 probs=0.0453 0.0453 0.9094\npred=0 probs=0.4223 0.4223 0.1554\nloss=0.4724',
          isPublic: false,
        },
      ],
    },
  },
  {
    instructorEmail: 'daniel.park@skillpath.test',
    categorySlug: 'machine-learning',
    topics: [{ slug: 'machine-learning', primary: true }, { slug: 'python' }, { slug: 'data-science' }],
    language: 'en',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Machine Learning A–Z in Python: Core Algorithms Explained',
    subtitle: 'Understand and apply regression, classification and clustering in Python with scikit-learn on real datasets',
    description:
      'Machine learning is often taught either as pure math or as a list of library calls. Neither helps much when you sit down with a real dataset and have to decide which model to try, how to split the data and whether a 92% accuracy score is actually good. This course walks through the core algorithms one at a time, explains the intuition behind each with small examples you can check by hand, and then applies them to real public datasets with scikit-learn.\n\nWe cover the full workflow a beginner needs: loading and cleaning data, splitting it correctly, training a model, and evaluating it honestly. Along the way you will meet linear and logistic regression, k-nearest neighbors, decision trees and random forests, and k-means clustering. Each algorithm gets the same treatment: what problem it solves, how it makes a prediction, which settings matter, and what failure looks like.\n\nBy the end of the course you will be able to:\n• Pick a reasonable first model for a regression, classification or clustering task\n• Set up a train/test split and cross-validation without leaking information from the test set\n• Read a confusion matrix and choose between accuracy, precision and recall for the problem at hand\n• Explain your model choice to a teammate in plain language\n\nThe course is free and project-driven. Every section ends with a notebook you complete yourself, and the coding exercise asks you to implement k-nearest neighbors from scratch using only the Python standard library, so you see that the algorithm is just distances and a vote. No prior machine learning experience is required; if you can write a Python loop and read a table of numbers, you are ready to start.',
    learningObjectives: [
      'Train and compare linear regression, logistic regression, kNN, decision trees and random forests with scikit-learn',
      'Split data into training and test sets and use cross-validation without data leakage',
      'Evaluate classifiers with a confusion matrix, precision, recall and accuracy',
      'Group unlabeled data with k-means and choose the number of clusters with the elbow method',
      'Implement k-nearest neighbors from scratch in plain Python',
    ],
    requirements: ['Basic Python: variables, loops, functions and lists', 'High-school level algebra; no calculus required'],
    targetAudience: [
      'Beginners who want a structured first course in machine learning',
      'Developers and analysts who use data daily and want to start building predictive models',
    ],
    thumbnail: { label: 'ML A–Z', tagline: 'Core algorithms in Python' },
    sections: [
      {
        title: 'Machine Learning Foundations',
        lectures: [
          'Welcome: what machine learning is and how this course is organized',
          'Setting up Python, Jupyter and scikit-learn',
        ],
      },
      {
        title: 'Supervised Learning',
        lectures: [
          'Linear regression and the mean squared error',
          'Logistic regression and the sigmoid function',
          'k-nearest neighbors: distance, choosing k and majority voting',
          'Decision trees and random forests',
        ],
      },
      {
        title: 'Evaluation and Unsupervised Learning',
        lectures: [
          'Train/test split, cross-validation and data leakage',
          'Confusion matrix, precision and recall',
          'k-means clustering and the elbow method',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: Core ML concepts',
      description: 'Review model choice, evaluation metrics and the most common beginner mistakes.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Why should a StandardScaler be fitted only on the training set?',
          relatedLecture: 6,
          options: [
            {
              content: 'Fitting it on all data leaks information about the test set into training',
              correct: true,
              explanation: 'The mean and standard deviation would include test rows, so the test score would look better than real performance.',
            },
            {
              content: 'Because scaling the test set is not allowed',
              explanation: 'The test set must be scaled too, using the statistics learned from the training set.',
            },
            {
              content: 'It makes training run faster',
              explanation: 'Speed is not the reason; the point is a fair, leak-free evaluation.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What usually happens when you use k = 1 in k-nearest neighbors?',
          relatedLecture: 4,
          options: [
            {
              content: 'The model becomes very sensitive to noisy points and tends to overfit',
              correct: true,
              explanation: 'With k = 1 every prediction copies a single neighbor, so one mislabeled point changes the result.',
            },
            {
              content: 'The model underfits because it ignores the training data',
              explanation: 'k = 1 relies on the training data as much as possible; underfitting is more typical of a very large k.',
            },
            {
              content: 'Predictions become impossible because there is no vote',
              explanation: 'A single neighbor still gives a prediction; the vote simply has one participant.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Which statements about precision and recall are correct?',
          relatedLecture: 7,
          options: [
            {
              content: 'Precision = TP / (TP + FP)',
              correct: true,
              explanation: 'Precision measures how many of the predicted positives are really positive.',
            },
            {
              content: 'Recall = TP / (TP + FN)',
              correct: true,
              explanation: 'Recall measures how many of the actual positives the model found.',
            },
            {
              content: 'Raising the decision threshold usually increases recall',
              explanation: 'A higher threshold predicts fewer positives, which usually lowers recall and raises precision.',
            },
            {
              content: 'Accuracy is a reliable metric for heavily imbalanced data',
              explanation: 'With 99% negatives, a model that always predicts negative scores 99% accuracy while being useless.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What does logistic regression output for a single sample before a threshold is applied?',
          relatedLecture: 3,
          options: [
            {
              content: 'A probability between 0 and 1 produced by the sigmoid function',
              correct: true,
              explanation: 'The linear score is passed through the sigmoid, which maps any real number to the range 0 to 1.',
            },
            {
              content: 'An unbounded real number like linear regression',
              explanation: 'That is the raw linear score; logistic regression squashes it with the sigmoid.',
            },
            {
              content: 'The index of the nearest training sample',
              explanation: 'That describes nearest-neighbor methods, not logistic regression.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What must you decide before running k-means?',
          relatedLecture: 8,
          options: [
            {
              content: 'The number of clusters k',
              correct: true,
              explanation: 'k-means needs k up front; the elbow method helps choose it by plotting inertia against k.',
            },
            {
              content: 'The label of every data point',
              explanation: 'k-means is unsupervised and works without labels.',
            },
            {
              content: 'The depth of the tree',
              explanation: 'Depth is a decision tree setting and has no meaning in k-means.',
            },
          ],
        },
      ],
    },
    exercise: {
      title: 'k-nearest neighbors from scratch',
      learningObjective: 'Classify new points with kNN using squared Euclidean distance and a majority vote',
      instructions:
        'Implement a k-nearest neighbors classifier.\n\nInput: the first line is k, the second line is n (number of training points). The next n lines each contain "x y label" where x and y are integers and label is a word. Then a line with q (number of queries) followed by q lines "x y".\n\nFor each query print the predicted label on its own line. Sort training points by squared Euclidean distance to the query; if two points have the same distance, the one that appears earlier in the input comes first. Take the first k points and pick the label with the most votes. If several labels tie, choose the one whose first appearance in that sorted list is closest to the query.\n\nExample input:\n3\n6\n1 1 cat\n2 1 cat\n8 8 dog\n9 8 dog\n8 9 dog\n1 2 cat\n2\n2 2\n7 7\n\nExample output:\ncat\ndog',
      hints: [
        'Squared distance (dx*dx + dy*dy) gives the same ordering as the real distance and avoids floating point.',
        'sorted() with a key of (distance, index) handles ties in distance.',
        'Record labels in the order you first see them among the k neighbors to break vote ties.',
      ],
      solutionExplanation:
        'We sort the indices of the training points by (squared distance, input position), keep the first k, and count votes in a dictionary while remembering the order in which each label first appears. The winner is the first label in that order whose vote count equals the maximum, which implements the "closest label wins a tie" rule without extra sorting.',
      difficulty: 'easy',
      relatedLecture: 4,
      code: [
        {
          language: 'python',
          starter: `import sys


def predict(train, k, qx, qy):
    # TODO: return the predicted label for the query point (qx, qy)
    return ""


def main():
    data = sys.stdin.read().split()
    k, n = int(data[0]), int(data[1])
    # TODO: read n training points (x, y, label), then q queries,
    # and print one predicted label per query


main()
`,
          solution: `import sys


def predict(train, k, qx, qy):
    ranked = sorted(
        range(len(train)),
        key=lambda i: ((train[i][0] - qx) ** 2 + (train[i][1] - qy) ** 2, i),
    )[:k]
    votes = {}
    order = []
    for i in ranked:
        label = train[i][2]
        if label not in votes:
            votes[label] = 0
            order.append(label)
        votes[label] += 1
    best = max(votes.values())
    for label in order:
        if votes[label] == best:
            return label


def main():
    data = sys.stdin.read().split()
    k, n = int(data[0]), int(data[1])
    pos = 2
    train = []
    for _ in range(n):
        train.append((int(data[pos]), int(data[pos + 1]), data[pos + 2]))
        pos += 3
    q = int(data[pos])
    pos += 1
    for _ in range(q):
        print(predict(train, k, int(data[pos]), int(data[pos + 1])))
        pos += 2


main()
`,
        },
      ],
      tests: [
        {
          input: '3\n6\n1 1 cat\n2 1 cat\n8 8 dog\n9 8 dog\n8 9 dog\n1 2 cat\n2\n2 2\n7 7\n',
          expectedOutput: 'cat\ndog',
          isPublic: true,
        },
        {
          input: '1\n4\n0 0 red\n5 5 blue\n10 0 green\n3 3 blue\n3\n1 1\n4 4\n9 1\n',
          expectedOutput: 'red\nblue\ngreen',
          isPublic: false,
        },
        {
          input: '4\n6\n0 0 a\n1 0 b\n0 2 a\n2 1 b\n10 10 c\n11 10 c\n1\n1 1\n',
          expectedOutput: 'b',
          isPublic: false,
        },
        {
          input: '3\n7\n2 3 setosa\n3 3 setosa\n6 5 versicolor\n7 5 versicolor\n7 6 virginica\n8 7 virginica\n6 6 versicolor\n2\n6 5\n8 6\n',
          expectedOutput: 'versicolor\nvirginica',
          isPublic: false,
        },
      ],
    },
  },
  {
    instructorEmail: 'daniel.park@skillpath.test',
    categorySlug: 'ai-for-developers',
    topics: [
      { slug: 'langchain', primary: true },
      { slug: 'retrieval-augmented-generation' },
      { slug: 'large-language-models' },
    ],
    language: 'en',
    level: 'intermediate',
    priceAmount: 799_000,
    status: 'published',
    title: 'Build LLM Apps with LangChain and RAG',
    subtitle: 'Ship a question-answering app over your own documents using LangChain, embeddings and a vector store',
    description:
      "Calling a large language model from code takes five minutes. Getting it to answer correctly from your own documents, cite where the answer came from and admit when it does not know takes much longer. This course is about that second part. You will build a retrieval-augmented generation (RAG) application step by step with LangChain and learn why each piece exists, so you can adapt the design to your own data instead of copying a template.\n\nWe begin with how chat models are called: messages, tokens, temperature and context window limits. Then we cover the LangChain building blocks you will use every day, including prompt templates, chat models, output parsers and composing them with the LangChain Expression Language. The core of the course is the RAG pipeline: loading documents, splitting them into chunks, creating embeddings, storing them in a local vector store and building a retriever that feeds the right context into the prompt.\n\nAlong the way you will learn to:\n• Choose chunk size and overlap based on your documents rather than guesswork\n• Write prompts that keep the model grounded in retrieved context\n• Return source citations with every answer\n• Build a small evaluation set to catch regressions when you change the pipeline\n\nThe examples work with any chat model provider that LangChain supports, and the vector store runs locally, so you can follow along without special infrastructure. The coding exercise has you implement overlapping chunking and a simple keyword retriever in plain Python, which makes it much easier to reason about what the library is doing for you. The final section covers conversation memory, streaming responses and handling failures, the details that separate a demo from an app real users can rely on.",
    learningObjectives: [
      'Call chat models through LangChain with prompt templates, output parsers and LCEL chains',
      'Split documents into overlapping chunks and justify the chosen chunk size and overlap',
      'Create embeddings, store them in a vector store and retrieve the most relevant chunks for a question',
      'Build a RAG chain that answers from retrieved context and returns source citations',
      'Evaluate answer faithfulness and relevance with a small hand-written test set',
    ],
    requirements: [
      'Solid Python, including functions, classes and virtual environments',
      'An API key for a chat model provider, or a locally running open model',
    ],
    targetAudience: [
      'Backend developers asked to add an AI assistant or document search to a product',
      'Developers who have tried LLM APIs and want a structured way to build reliable apps',
    ],
    thumbnail: { label: 'LangChain', tagline: 'RAG apps on your own docs' },
    sections: [
      {
        title: 'LLM Foundations for Developers',
        lectures: [
          'Course overview and setting up API keys and a Python environment',
          'How chat models are called: messages, tokens, temperature and context windows',
        ],
      },
      {
        title: 'LangChain Building Blocks',
        lectures: [
          'Prompt templates, chat models and output parsers',
          'Composing chains with LCEL and the pipe operator',
        ],
      },
      {
        title: 'Retrieval-Augmented Generation',
        lectures: [
          'Loading documents and chunking with RecursiveCharacterTextSplitter',
          'Embeddings and storing vectors in Chroma or FAISS',
          'Building the retriever and a RAG chain with source citations',
        ],
      },
      {
        title: 'From Prototype to Product',
        lectures: [
          'Evaluating answers: faithfulness, relevance and a small test set',
          'Conversation memory, streaming responses and handling failures',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: LangChain and RAG',
      description: 'Check your understanding of chunking, embeddings, chains and grounded answers.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Why do text splitters usually use a chunk overlap?',
          relatedLecture: 4,
          options: [
            {
              content: 'So a sentence that crosses a chunk boundary still appears whole in at least one chunk',
              correct: true,
              explanation: 'Overlap keeps context that would otherwise be cut in half, which improves retrieval quality.',
            },
            {
              content: 'To reduce the total number of chunks stored',
              explanation: 'Overlap actually increases the number of chunks slightly because text is repeated.',
            },
            {
              content: 'Because embedding models reject chunks without overlap',
              explanation: 'Embedding models embed each chunk independently and know nothing about overlap.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What is an embedding in a RAG pipeline?',
          relatedLecture: 5,
          options: [
            {
              content: 'A vector of numbers that represents the meaning of a text, so similar texts end up close together',
              correct: true,
              explanation: 'Retrieval works by comparing the query vector with chunk vectors using a similarity measure such as cosine similarity.',
            },
            {
              content: 'A compressed copy of the document used to save disk space',
              explanation: 'Embeddings cannot reliably be turned back into the original text; they capture meaning, not content for storage.',
            },
            {
              content: 'The system prompt that is embedded into every request',
              explanation: 'The system prompt is plain text sent to the chat model, not an embedding.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Which techniques help a RAG app avoid made-up answers?',
          relatedLecture: 6,
          options: [
            {
              content: 'Instruct the model to answer only from the provided context and say when the answer is not there',
              correct: true,
              explanation: 'Explicit grounding instructions reduce the chance the model fills gaps with invented facts.',
            },
            {
              content: 'Return the source chunks alongside the answer',
              correct: true,
              explanation: 'Citations let users and evaluators verify the answer against the original text.',
            },
            {
              content: 'Raise the temperature so the model explores more options',
              explanation: 'Higher temperature makes output more random, which tends to increase unsupported claims.',
            },
            {
              content: 'Put the entire knowledge base into every prompt',
              explanation: 'This usually exceeds the context window and buries the relevant passage among irrelevant text.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What is the main effect of setting temperature to 0?',
          relatedLecture: 1,
          options: [
            {
              content: 'The model picks the most likely tokens, so output becomes much more consistent between runs',
              correct: true,
              explanation: 'Low temperature reduces sampling randomness, which is useful for extraction and grounded answers.',
            },
            {
              content: 'The model stops using the context window',
              explanation: 'Temperature controls sampling only; the context is still read in full.',
            },
            {
              content: 'The response is guaranteed to be factually correct',
              explanation: 'A deterministic answer can still be wrong; temperature does not add knowledge.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'In LCEL, what does the chain prompt | model | parser do?',
          relatedLecture: 3,
          options: [
            {
              content: 'Passes the output of each step as the input of the next step',
              correct: true,
              explanation: 'The pipe operator composes runnables: the formatted prompt goes to the model, and the model message goes to the parser.',
            },
            {
              content: 'Runs the three steps in parallel and merges the results',
              explanation: 'Parallel execution needs RunnableParallel or a dictionary of runnables, not the pipe operator.',
            },
            {
              content: 'Tries each step in turn until one succeeds',
              explanation: 'That describes a fallback chain configured with with_fallbacks, not a pipe.',
            },
          ],
        },
      ],
    },
    exercise: {
      title: 'Chunk a document and retrieve the best chunks',
      learningObjective: 'Implement overlapping word chunking and a simple keyword-overlap retriever like the first stage of a RAG pipeline',
      instructions:
        'The first line has three integers: size, overlap and k (overlap is smaller than size). The second line is the user query. All remaining lines form the document.\n\nSplit the document into words on whitespace. Build chunks of size words: the first chunk starts at word 0, and each next chunk starts size - overlap words later. Stop after the chunk that reaches the last word.\n\nNormalize a word by lowercasing it and stripping the characters . , ! ? ; : from both ends. The score of a chunk is the number of distinct normalized query words that also appear in the chunk.\n\nPrint "chunks: <count>", then the top k chunks sorted by score (highest first, smaller index first on ties), each as "#<index> score=<score>: <chunk words joined by one space>".\n\nExample input:\n50 10 1\nwhat is an embedding\nAn embedding is a list of numbers that represents the meaning of a text.\n\nExample output:\nchunks: 1\n#0 score=3: An embedding is a list of numbers that represents the meaning of a text.',
      hints: [
        'Join all document lines with a space before splitting, so line breaks do not matter.',
        'Use sets for the query words and the chunk words, then take their intersection.',
        'Sort with key (-score, index) to get the required order.',
      ],
      solutionExplanation:
        'We walk a start pointer through the word list in steps of size - overlap, slicing a chunk each time and stopping once the slice reaches the end. Each chunk is scored by intersecting its set of normalized words with the set of normalized query words. Sorting by negative score then index gives a stable ranking, which is the same idea as a vector retriever except that similarity is word overlap instead of cosine distance.',
      difficulty: 'medium',
      relatedLecture: 4,
      code: [
        {
          language: 'python',
          starter: `import sys


def normalize(word):
    return word.lower().strip(".,!?;:")


def chunk_words(words, size, overlap):
    # TODO: return a list of chunks, each chunk is a list of words
    return []


def main():
    lines = sys.stdin.read().splitlines()
    size, overlap, top_k = (int(x) for x in lines[0].split())
    query = lines[1]
    words = " ".join(lines[2:]).split()
    # TODO: chunk, score each chunk against the query and print the result


main()
`,
          solution: `import sys


def normalize(word):
    return word.lower().strip(".,!?;:")


def chunk_words(words, size, overlap):
    chunks = []
    start = 0
    while True:
        chunks.append(words[start:start + size])
        if start + size >= len(words):
            return chunks
        start += size - overlap


def main():
    lines = sys.stdin.read().splitlines()
    size, overlap, top_k = (int(x) for x in lines[0].split())
    query_terms = set(normalize(w) for w in lines[1].split())
    words = " ".join(lines[2:]).split()
    chunks = chunk_words(words, size, overlap)
    scored = []
    for i, chunk in enumerate(chunks):
        terms = set(normalize(w) for w in chunk)
        scored.append((len(query_terms & terms), i))
    scored.sort(key=lambda s: (-s[0], s[1]))
    print("chunks: " + str(len(chunks)))
    for score, i in scored[:top_k]:
        print("#" + str(i) + " score=" + str(score) + ": " + " ".join(chunks[i]))


main()
`,
        },
      ],
      tests: [
        {
          input: '50 10 1\nwhat is an embedding\nAn embedding is a list of numbers that represents the meaning of a text.\n',
          expectedOutput: 'chunks: 1\n#0 score=3: An embedding is a list of numbers that represents the meaning of a text.',
          isPublic: true,
        },
        {
          input:
            '8 2 2\nhow does the retriever pick chunks?\nA RAG pipeline splits documents into chunks before indexing. The retriever compares the query with every chunk and returns the closest ones. The language model then answers using only the retrieved chunks as context.\n',
          expectedOutput:
            'chunks: 6\n#1 score=3: chunks before indexing. The retriever compares the query\n#4 score=2: model then answers using only the retrieved chunks',
          isPublic: true,
        },
        {
          input:
            '5 0 3\nvector store index\nThe vector store keeps embeddings. Each index entry points to a chunk.\nA good index makes search fast. The store also keeps metadata for filtering.\n',
          expectedOutput:
            'chunks: 5\n#0 score=2: The vector store keeps embeddings.\n#1 score=1: Each index entry points to\n#2 score=1: a chunk. A good index',
          isPublic: false,
        },
        {
          input:
            '6 3 2\nPrompt template with context\nA prompt template has slots. The context slot receives retrieved text.\nThe question slot receives user input.\n',
          expectedOutput: 'chunks: 5\n#0 score=2: A prompt template has slots. The\n#1 score=1: has slots. The context slot receives',
          isPublic: false,
        },
      ],
    },
  },
  {
    instructorEmail: 'daniel.park@skillpath.test',
    categorySlug: 'machine-learning',
    topics: [{ slug: 'tensorflow', primary: true }, { slug: 'deep-learning' }],
    language: 'en',
    level: 'intermediate',
    priceAmount: 0,
    status: 'published',
    title: 'TensorFlow & Keras in Practice',
    subtitle: 'Design, train and deploy Keras models in TensorFlow, from dense networks to CNNs and transfer learning',
    description:
      "Keras makes it easy to stack a few layers and call fit(). It is less obvious what to do when the model trains slowly, the validation curve flattens after two epochs or model.summary() reports millions of parameters you did not expect. This course teaches TensorFlow and Keras the way you use them on a real project: building input pipelines, choosing the right model API, reading what the framework tells you and shipping the result.\n\nWe start with tensors and tf.data, because a slow or badly shuffled input pipeline silently limits every model you train. Then we compare the Sequential and Functional APIs, learn to read model.summary() line by line, and train models with compile(), fit() and callbacks such as EarlyStopping and ModelCheckpoint. The vision section builds a convolutional network from scratch and then uses transfer learning with a pretrained backbone to get strong results from a small dataset.\n\nAfter this course you will be able to:\n• Build efficient tf.data pipelines with batching, caching and prefetching\n• Predict the output shape and parameter count of each layer before you run the model\n• Use callbacks to stop training at the right time and keep the best weights\n• Fine-tune a pretrained network and export it for serving or for mobile with TensorFlow Lite\n\nEvery lecture comes with a notebook, and the coding exercise asks you to reproduce the core of model.summary() in plain Python: given an input shape and a list of Conv2D, MaxPooling2D, Flatten and Dense layers, compute each output shape and the total number of parameters. Once you can do that by hand, sizing a network stops being trial and error. The course is free and assumes you know Python and the basic idea of training a neural network.",
    learningObjectives: [
      'Build tf.data input pipelines with shuffling, batching, caching and prefetching',
      'Define models with both the Sequential and Functional APIs and choose between them',
      'Calculate output shapes and parameter counts for Conv2D, pooling and Dense layers',
      'Train with compile(), fit() and callbacks such as EarlyStopping and ModelCheckpoint',
      'Apply transfer learning with a frozen pretrained backbone and then fine-tune it',
      'Save models in the .keras format and convert them to TensorFlow Lite',
    ],
    requirements: [
      'Working knowledge of Python and NumPy arrays',
      'Basic understanding of what a neural network, loss and gradient descent are',
    ],
    targetAudience: [
      'Developers who want a practical, project-oriented path into TensorFlow',
      'Students preparing a deep learning project for coursework or a portfolio',
    ],
    thumbnail: { label: 'TensorFlow', tagline: 'Keras models, start to deploy' },
    sections: [
      {
        title: 'Setting Up and Feeding Data',
        lectures: ['Course introduction and installing TensorFlow', 'Tensors, tf.data pipelines and batching'],
      },
      {
        title: 'Building and Training Keras Models',
        lectures: [
          'Sequential vs Functional API: when to use each',
          'Reading model.summary(): output shapes and parameter counts',
          'compile(), fit() and callbacks like EarlyStopping',
        ],
      },
      {
        title: 'Computer Vision with Keras',
        lectures: [
          'Conv2D and MaxPooling2D for image classification',
          'Transfer learning with a pretrained MobileNetV2 backbone',
        ],
      },
      {
        title: 'Shipping the Model',
        lectures: [
          'Saving in the .keras format and converting to TensorFlow Lite',
          'Serving a SavedModel behind a REST endpoint',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: Keras models and training',
      description: 'Review parameter counting, callbacks, transfer learning and data pipelines.',
      questions: [
        {
          type: 'single_choice',
          stem: 'A Dense(10) layer receives an input of shape (None, 64). How many trainable parameters does it have?',
          relatedLecture: 3,
          options: [
            {
              content: '650',
              correct: true,
              explanation: 'Each of the 10 units has 64 weights plus 1 bias: (64 + 1) × 10 = 650.',
            },
            {
              content: '640',
              explanation: 'This counts the weights but forgets the 10 bias terms.',
            },
            {
              content: '74',
              explanation: 'Parameters multiply inputs by units; they are not added together.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What does EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True) do?',
          relatedLecture: 4,
          options: [
            {
              content: 'Stops training after 3 epochs without val_loss improvement and restores the weights from the best epoch',
              correct: true,
              explanation: 'patience sets how long to wait, and restore_best_weights rolls the model back to the epoch with the lowest val_loss.',
            },
            {
              content: 'Stops training after exactly 3 epochs',
              explanation: 'patience counts epochs without improvement, not total epochs.',
            },
            {
              content: 'Lowers the learning rate when val_loss stops improving',
              explanation: 'That is the job of ReduceLROnPlateau, a different callback.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Which steps belong to a sound transfer learning workflow?',
          relatedLecture: 6,
          options: [
            {
              content: 'Freeze the pretrained base (base.trainable = False) while training the new head',
              correct: true,
              explanation: 'Freezing protects the pretrained features from large gradients produced by a randomly initialized head.',
            },
            {
              content: 'Use a small learning rate when unfreezing layers for fine-tuning',
              correct: true,
              explanation: 'A small learning rate adjusts pretrained weights gently instead of destroying them.',
            },
            {
              content: 'Train every layer with a high learning rate from the first epoch',
              explanation: 'Large updates to the whole network early on wipe out what the backbone learned.',
            },
            {
              content: 'Skip the preprocessing function the backbone was trained with',
              explanation: 'The backbone expects inputs scaled the same way as during pretraining; skipping it hurts accuracy.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'When do you need the Functional API instead of a Sequential model?',
          relatedLecture: 2,
          options: [
            {
              content: 'When the model has multiple inputs or outputs, or layers that branch and merge',
              correct: true,
              explanation: 'Sequential only supports a single linear stack; the Functional API describes any directed graph of layers.',
            },
            {
              content: 'Whenever the model has more than ten layers',
              explanation: 'Depth does not matter; a long linear stack still fits in Sequential.',
            },
            {
              content: 'Only when training on more than one GPU',
              explanation: 'Distribution strategy is independent of how the model is defined.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Why add .prefetch(tf.data.AUTOTUNE) at the end of an input pipeline?',
          relatedLecture: 1,
          options: [
            {
              content: 'So the next batch is prepared while the current batch is being used for training',
              correct: true,
              explanation: 'Prefetching overlaps data preparation with model execution, which keeps the accelerator busy.',
            },
            {
              content: 'To shuffle the dataset between epochs',
              explanation: 'Shuffling is done with .shuffle(); prefetch does not change the order.',
            },
            {
              content: 'To load the whole dataset into memory before training',
              explanation: 'That is closer to .cache(); prefetch only buffers a few upcoming batches.',
            },
          ],
        },
      ],
    },
    exercise: {
      title: 'Reproduce model.summary()',
      learningObjective: 'Compute output shapes and parameter counts for a stack of Keras layers',
      instructions:
        'The first line is the input shape without the batch dimension: either "h w c" for images or a single number for flat vectors. The second line is n, the number of layers. Each of the next n lines describes one layer:\n• "Conv2D filters kernel": square kernel, stride 1, padding "valid"\n• "MaxPooling2D pool": square pool with stride equal to the pool size (round down)\n• "Flatten"\n• "Dense units"\n\nFor each layer print "<name> <output shape> params=<count>", where the shape is written like Keras with None for the batch, e.g. (None, 26, 26, 32). Conv2D has kernel*kernel*in_channels*filters + filters parameters; Dense has (inputs + 1) * units; pooling and Flatten have 0. Finally print "Total params: <total>" with a comma as the thousands separator.\n\nExample input:\n28 28 1\n4\nConv2D 32 3\nMaxPooling2D 2\nFlatten\nDense 10\n\nExample output:\nConv2D (None, 26, 26, 32) params=320\nMaxPooling2D (None, 13, 13, 32) params=0\nFlatten (None, 5408) params=0\nDense (None, 10) params=54090\nTotal params: 54,410',
      hints: [
        'Keep the current shape as a list and update it after every layer.',
        'With valid padding and stride 1, the output side is input side - kernel + 1.',
        'f"{total:,}" formats an integer with comma separators.',
      ],
      solutionExplanation:
        'We track the current shape as a list. Conv2D reads the channel count from the shape to compute its weights, then shrinks height and width by kernel - 1 and replaces channels with filters. MaxPooling2D divides height and width with integer division. Flatten multiplies all dimensions together, and Dense uses the last dimension as its input size. Summing per-layer parameters gives the same total that model.summary() reports.',
      difficulty: 'easy',
      relatedLecture: 3,
      code: [
        {
          language: 'python',
          starter: `import sys


def fmt_shape(shape):
    return "(None, " + ", ".join(str(d) for d in shape) + ")"


def main():
    lines = sys.stdin.read().splitlines()
    shape = [int(x) for x in lines[0].split()]
    n = int(lines[1])
    # TODO: for each layer update shape, compute params and print one line,
    # then print the total with comma separators


main()
`,
          solution: `import sys


def fmt_shape(shape):
    return "(None, " + ", ".join(str(d) for d in shape) + ")"


def main():
    lines = sys.stdin.read().splitlines()
    shape = [int(x) for x in lines[0].split()]
    n = int(lines[1])
    total = 0
    for line in lines[2:2 + n]:
        parts = line.split()
        name = parts[0]
        params = 0
        if name == "Conv2D":
            filters, kernel = int(parts[1]), int(parts[2])
            h, w, c = shape
            params = kernel * kernel * c * filters + filters
            shape = [h - kernel + 1, w - kernel + 1, filters]
        elif name == "MaxPooling2D":
            pool = int(parts[1])
            h, w, c = shape
            shape = [h // pool, w // pool, c]
        elif name == "Flatten":
            size = 1
            for d in shape:
                size *= d
            shape = [size]
        elif name == "Dense":
            units = int(parts[1])
            params = (shape[-1] + 1) * units
            shape = shape[:-1] + [units]
        total += params
        print(name + " " + fmt_shape(shape) + " params=" + str(params))
    print(f"Total params: {total:,}")


main()
`,
        },
      ],
      tests: [
        {
          input: '28 28 1\n4\nConv2D 32 3\nMaxPooling2D 2\nFlatten\nDense 10\n',
          expectedOutput:
            'Conv2D (None, 26, 26, 32) params=320\nMaxPooling2D (None, 13, 13, 32) params=0\nFlatten (None, 5408) params=0\nDense (None, 10) params=54090\nTotal params: 54,410',
          isPublic: true,
        },
        {
          input: '784\n3\nDense 128\nDense 64\nDense 10\n',
          expectedOutput:
            'Dense (None, 128) params=100480\nDense (None, 64) params=8256\nDense (None, 10) params=650\nTotal params: 109,386',
          isPublic: true,
        },
        {
          input: '32 32 3\n6\nConv2D 32 3\nConv2D 32 3\nMaxPooling2D 2\nFlatten\nDense 64\nDense 10\n',
          expectedOutput:
            'Conv2D (None, 30, 30, 32) params=896\nConv2D (None, 28, 28, 32) params=9248\nMaxPooling2D (None, 14, 14, 32) params=0\nFlatten (None, 6272) params=0\nDense (None, 64) params=401472\nDense (None, 10) params=650\nTotal params: 412,266',
          isPublic: false,
        },
        {
          input: '64 64 3\n5\nConv2D 16 5\nMaxPooling2D 3\nConv2D 8 3\nFlatten\nDense 1\n',
          expectedOutput:
            'Conv2D (None, 60, 60, 16) params=1216\nMaxPooling2D (None, 20, 20, 16) params=0\nConv2D (None, 18, 18, 8) params=1160\nFlatten (None, 2592) params=0\nDense (None, 1) params=2593\nTotal params: 4,969',
          isPublic: false,
        },
      ],
    },
  },
  {
    instructorEmail: 'kiet.dang@skillpath.test',
    categorySlug: 'ai-fundamentals',
    topics: [{ slug: 'large-language-models', primary: true }, { slug: 'machine-learning' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Hiểu mô hình ngôn ngữ lớn (LLM) cho người mới',
    subtitle: 'Hiểu LLM hoạt động ra sao, viết prompt hiệu quả và biết khi nào không nên tin câu trả lời của AI',
    description:
      'Bạn dùng chatbot AI mỗi ngày để viết email, tóm tắt tài liệu hay hỏi code, nhưng vẫn thấy nó như một chiếc hộp đen: lúc trả lời rất hay, lúc lại bịa ra một hàm không tồn tại với giọng hoàn toàn tự tin. Khoá học này giúp bạn hiểu chuyện gì đang diễn ra bên trong một mô hình ngôn ngữ lớn, bằng ngôn ngữ đời thường và ví dụ cụ thể, không cần biết toán hay lập trình chuyên sâu.\n\nChúng ta bắt đầu từ ý tưởng cơ bản của machine learning: mô hình học quy luật từ dữ liệu thay vì được viết sẵn luật. Từ đó, bạn sẽ hiểu token là gì, vì sao mô hình có giới hạn context window, tại sao cùng một câu hỏi lại nhận được câu trả lời khác nhau, và các bước pre-training, fine-tuning, RLHF biến một mô hình "đoán từ tiếp theo" thành trợ lý biết làm theo hướng dẫn. Mỗi khái niệm đều đi kèm ví dụ bạn có thể tự thử ngay trên công cụ AI mình đang dùng.\n\nSau khoá học, bạn sẽ:\n• Giải thích được cho đồng nghiệp LLM hoạt động thế nào mà không cần thuật ngữ phức tạp\n• Viết prompt có cấu trúc rõ ràng để nhận câu trả lời đúng định dạng mình cần\n• Nhận diện dấu hiệu hallucination và có thói quen kiểm chứng trước khi dùng kết quả\n• Biết những loại dữ liệu không nên đưa vào công cụ AI ở nơi làm việc\n\nĐiểm khác của khoá học là tập trung vào hiểu đúng thay vì mẹo vặt. Prompt "thần thánh" có thể lỗi thời sau vài tháng, nhưng khi đã hiểu cơ chế, bạn sẽ tự điều chỉnh được với bất kỳ công cụ nào. Khoá học miễn phí, phù hợp cho sinh viên, lập trình viên mới và cả người không làm kỹ thuật muốn dùng AI một cách tỉnh táo.',
    learningObjectives: [
      'Giải thích token, context window và cơ chế dự đoán từ tiếp theo của LLM bằng ví dụ đơn giản',
      'Phân biệt pre-training, fine-tuning và RLHF cùng vai trò của từng giai đoạn',
      'Điều chỉnh temperature và hiểu ảnh hưởng của nó đến độ ổn định của câu trả lời',
      'Viết prompt có vai trò, ngữ cảnh, ví dụ mẫu và định dạng đầu ra rõ ràng',
      'Nhận diện hallucination và áp dụng ít nhất hai cách kiểm chứng câu trả lời của AI',
    ],
    requirements: ['Biết dùng máy tính và trình duyệt web cơ bản', 'Có tài khoản một công cụ chatbot AI bất kỳ để thực hành'],
    targetAudience: [
      'Sinh viên và lập trình viên mới muốn hiểu nền tảng của AI tạo sinh',
      'Người làm văn phòng, quản lý dự án muốn dùng AI hiệu quả và an toàn hơn',
    ],
    thumbnail: { label: 'LLM', tagline: 'Hiểu AI từ gốc' },
    sections: [
      {
        title: 'Bắt đầu với AI tạo sinh',
        lectures: [
          'Giới thiệu khoá học và cách học hiệu quả nhất',
          'Từ machine learning đến LLM: mô hình học từ dữ liệu như thế nào',
        ],
      },
      {
        title: 'Bên trong một mô hình ngôn ngữ lớn',
        lectures: [
          'Token và context window: vì sao AI "quên" đoạn đầu cuộc trò chuyện',
          'Dự đoán từ tiếp theo: temperature và tính ngẫu nhiên của câu trả lời',
          'Pre-training, fine-tuning và RLHF qua ví dụ đời thường',
        ],
      },
      {
        title: 'Dùng LLM hiệu quả và an toàn',
        lectures: [
          'Viết prompt rõ ràng: vai trò, ngữ cảnh, ví dụ mẫu và định dạng đầu ra',
          'Hallucination: nhận diện và kiểm chứng câu trả lời',
          'Dữ liệu cá nhân, bản quyền và những việc không nên giao cho AI',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Nền tảng về LLM',
      description: 'Ôn lại token, temperature, các giai đoạn huấn luyện và cách dùng AI có trách nhiệm.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Token trong LLM là gì?',
          relatedLecture: 2,
          options: [
            {
              content: 'Một mẩu văn bản nhỏ (có thể là một từ, một phần của từ hoặc dấu câu) mà mô hình xử lý',
              correct: true,
              explanation: 'Mô hình không đọc từng chữ cái hay từng câu mà chia văn bản thành token; giới hạn context window cũng tính bằng token.',
            },
            {
              content: 'Mã đăng nhập để sử dụng chatbot',
              explanation: 'Đây là nghĩa "token" trong bảo mật, không liên quan đến cách mô hình đọc văn bản.',
            },
            {
              content: 'Luôn đúng bằng một từ tiếng Việt',
              explanation: 'Một từ tiếng Việt có dấu thường bị tách thành nhiều token, nên số token thường lớn hơn số từ.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Khi tăng temperature lên cao, câu trả lời của mô hình thường thay đổi thế nào?',
          relatedLecture: 3,
          options: [
            {
              content: 'Đa dạng và sáng tạo hơn nhưng kém ổn định, dễ lệch ý hơn',
              correct: true,
              explanation: 'Temperature cao làm mô hình chọn cả những token ít khả năng hơn, nên kết quả ngẫu nhiên hơn.',
            },
            {
              content: 'Chính xác hơn vì mô hình suy nghĩ kỹ hơn',
              explanation: 'Temperature chỉ điều chỉnh độ ngẫu nhiên khi chọn token, không làm mô hình biết thêm kiến thức.',
            },
            {
              content: 'Mô hình trả lời nhanh hơn',
              explanation: 'Tốc độ sinh văn bản gần như không phụ thuộc temperature.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những cách nào giúp giảm rủi ro dùng phải thông tin bịa (hallucination)?',
          relatedLecture: 6,
          options: [
            {
              content: 'Đưa tài liệu gốc vào prompt và yêu cầu mô hình chỉ trả lời dựa trên tài liệu đó',
              correct: true,
              explanation: 'Khi có ngữ cảnh cụ thể, mô hình ít phải "đoán" và bạn dễ đối chiếu câu trả lời hơn.',
            },
            {
              content: 'Yêu cầu nêu nguồn và tự kiểm tra lại nguồn đó',
              correct: true,
              explanation: 'Nguồn có thể cũng bị bịa, nên bước tự mở ra kiểm tra mới thật sự bảo vệ bạn.',
            },
            {
              content: 'Tin câu trả lời nếu mô hình viết với giọng rất chắc chắn',
              explanation: 'Mô hình luôn viết trôi chảy và tự tin, kể cả khi nội dung sai hoàn toàn.',
            },
            {
              content: 'Hỏi lại nhiều lần cho đến khi nhận được đáp án mình mong muốn',
              explanation: 'Cách này chỉ chọn ra câu trả lời hợp ý bạn, không làm câu trả lời đúng hơn.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Mục đích chính của giai đoạn RLHF là gì?',
          relatedLecture: 4,
          options: [
            {
              content: 'Dùng đánh giá của con người để mô hình trả lời hữu ích, đúng ý và an toàn hơn',
              correct: true,
              explanation: 'Người đánh giá xếp hạng các câu trả lời, và mô hình được tinh chỉnh để ưu tiên kiểu câu trả lời được đánh giá cao.',
            },
            {
              content: 'Nạp thêm toàn bộ dữ liệu Internet mới nhất cho mô hình',
              explanation: 'Học từ lượng dữ liệu lớn là việc của pre-training, không phải RLHF.',
            },
            {
              content: 'Giảm kích thước mô hình để chạy được trên điện thoại',
              explanation: 'Thu nhỏ mô hình dùng các kỹ thuật như quantization hay distillation, không phải RLHF.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Prompt nào có khả năng cho kết quả tốt nhất khi nhờ AI tóm tắt một biên bản họp?',
          relatedLecture: 5,
          options: [
            {
              content: '"Bạn là thư ký dự án. Tóm tắt biên bản dưới đây thành tối đa 5 gạch đầu dòng, mỗi dòng ghi rõ người phụ trách và hạn chót."',
              correct: true,
              explanation: 'Prompt có vai trò, nhiệm vụ cụ thể và định dạng đầu ra rõ ràng nên kết quả sát nhu cầu hơn.',
            },
            {
              content: '"Tóm tắt cái này."',
              explanation: 'Thiếu ngữ cảnh và định dạng, mô hình phải tự đoán độ dài và nội dung cần giữ lại.',
            },
            {
              content: '"Tóm tắt thật hay, thật chuẩn, không được sai."',
              explanation: 'Yêu cầu chung chung về chất lượng không cho mô hình biết cần giữ thông tin nào.',
            },
          ],
        },
      ],
    },
  },
  {
    instructorEmail: 'kiet.dang@skillpath.test',
    categorySlug: 'machine-learning',
    topics: [{ slug: 'mlops', primary: true }, { slug: 'docker' }, { slug: 'machine-learning' }],
    language: 'en',
    level: 'advanced',
    priceAmount: 999_000,
    status: 'published',
    title: 'MLOps: Deploying ML Models to Production',
    subtitle: 'Turn a trained model into a containerized, monitored service with tracking, CI/CD and safe rollouts',
    description:
      "A model that scores well in a notebook is only the beginning. To be useful it has to run as a service, return predictions within a latency budget, survive bad input, be retrained without breaking anything, and warn you when the real world stops looking like the training data. This course covers that journey end to end, using open-source tools you can run on your own machine or any cloud.\n\nWe take a trained scikit-learn model and turn it into a production-ready service. First we make the environment reproducible and package the model with its preprocessing. Then we serve it behind a FastAPI endpoint with proper input validation and containerize it with a lean multi-stage Dockerfile. In the second half we add the pieces that make the system maintainable: experiment tracking and a model registry with MLflow, a CI/CD pipeline that tests data and blocks models that do not meet a quality gate, monitoring for latency, errors and data drift, and rollout strategies that let you release a new model without betting everything on it.\n\nBy the end you will have:\n• A containerized prediction API with health checks and request validation\n• A tracked, versioned training pipeline where every model can be traced back to its data and code\n• A CI workflow that runs tests and a quality gate before a model can be promoted\n• A monitoring plan that tells you when to retrain\n\nThis is an advanced course. We assume you can already train models and are comfortable on the command line, so the time goes into engineering decisions and trade-offs rather than ML basics. Each section ends with a hands-on lab that extends the same project, so by the final lecture you have a complete reference implementation you can adapt at work.",
    learningObjectives: [
      'Package a model and its preprocessing with pinned dependencies for reproducible training and serving',
      'Serve predictions through a FastAPI service with input validation and health checks',
      'Build a small, secure Docker image for a model API using a multi-stage Dockerfile',
      'Track experiments and promote model versions through an MLflow model registry',
      'Set up CI/CD with data tests and a model quality gate before deployment',
      'Monitor data drift and roll out new models with shadow and canary strategies',
    ],
    requirements: [
      'Experience training models with scikit-learn or a deep learning framework',
      'Comfortable with the command line, Git and basic Docker commands',
    ],
    targetAudience: [
      'ML engineers and data scientists responsible for putting models into production',
      'Backend and DevOps engineers who need to operate machine learning services',
    ],
    thumbnail: { label: 'MLOps', tagline: 'Models in production' },
    sections: [
      {
        title: 'From Notebook to Service',
        lectures: [
          'Course overview: the gap between a notebook and production',
          'Packaging a model with a reproducible environment and pinned dependencies',
        ],
      },
      {
        title: 'Serving and Containerizing',
        lectures: [
          'Serving predictions with FastAPI and request validation',
          'Containerizing the model API with a multi-stage Dockerfile',
        ],
      },
      {
        title: 'Tracking and Automation',
        lectures: [
          'Experiment tracking and the model registry with MLflow',
          'CI/CD for ML: data tests, quality gates and automated image builds',
        ],
      },
      {
        title: 'Operating Models in Production',
        lectures: [
          'Monitoring latency, errors and data drift',
          'Shadow deployments, canary releases and rollback',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: MLOps in practice',
      description: 'Check your understanding of reproducibility, containers, registries, monitoring and rollouts.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Why pin exact library versions for both training and serving environments?',
          relatedLecture: 1,
          options: [
            {
              content: 'So the model is loaded and preprocessed with exactly the same code it was trained with',
              correct: true,
              explanation: 'Version mismatches can change preprocessing or deserialization, causing silent prediction differences or load errors.',
            },
            {
              content: 'Because newer library versions are always slower',
              explanation: 'Speed is not the concern; consistency between training and serving is.',
            },
            {
              content: 'It is only needed for deep learning models',
              explanation: 'Classical models pickled with one scikit-learn version can also fail or behave differently in another.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What is the main benefit of a multi-stage Dockerfile for a model API?',
          relatedLecture: 3,
          options: [
            {
              content: 'The final image contains only the runtime and the app, without compilers and build caches',
              correct: true,
              explanation: 'Build tools stay in an earlier stage, so the shipped image is smaller and has a smaller attack surface.',
            },
            {
              content: 'It lets the container use several CPUs at once',
              explanation: 'CPU usage is unrelated to how many stages the Dockerfile has.',
            },
            {
              content: 'It retrains the model automatically during the build',
              explanation: 'Training during docker build makes builds slow and non-reproducible; the model should be built and versioned separately.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Which signals help detect data drift after a model is deployed?',
          relatedLecture: 6,
          options: [
            {
              content: 'Comparing the distribution of incoming features with the training data',
              correct: true,
              explanation: 'A shift in input distributions is the most direct sign the model is seeing data it was not trained on.',
            },
            {
              content: 'A change in the distribution of predicted classes or scores',
              correct: true,
              explanation: 'Prediction drift often appears before labels are available, so it is a useful early warning.',
            },
            {
              content: 'The number of commits in the training repository',
              explanation: 'Code activity says nothing about how production data compares with training data.',
            },
            {
              content: 'The training accuracy reported when the model was first built',
              explanation: 'That number is fixed at training time and cannot reveal changes in production data.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What does a canary release of a new model version do?',
          relatedLecture: 7,
          options: [
            {
              content: 'Sends a small share of real traffic to the new version and widens it only if metrics stay healthy',
              correct: true,
              explanation: 'Limiting exposure first means a bad model affects few users and can be rolled back quickly.',
            },
            {
              content: 'Runs the new model on a copy of traffic without returning its predictions to users',
              explanation: 'That describes a shadow deployment, where users never see the new model output.',
            },
            {
              content: 'Replaces the old model for all users at once',
              explanation: 'An all-at-once switch is the opposite of a canary and offers no gradual safety net.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What problem does a model registry solve?',
          relatedLecture: 4,
          options: [
            {
              content: 'It keeps versioned models with their metadata and versions/aliases, so you know exactly which model is in production and how it was built',
              correct: true,
              explanation: 'Linking each version to its run, parameters and data makes promotion and rollback traceable.',
            },
            {
              content: 'It speeds up inference by caching predictions',
              explanation: 'Caching predictions is a serving optimization, not the purpose of a registry.',
            },
            {
              content: 'It replaces the need for a container image',
              explanation: 'The registry stores model artifacts; you still need a runtime such as a container to serve them.',
            },
          ],
        },
      ],
    },
  },
];
